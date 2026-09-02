/* ============================================================
   CAKESPHERE — admin.js
   Lógica del panel de administración
   ============================================================ */

// ============================================================
// Dashboard — Estadísticas
// ============================================================

/**
 * Carga las estadísticas del dashboard
 */
async function initDashboard() {
  await requireAdmin();
  showAdminUser();

  loadStats();
  loadRecentOrders();
  loadTopProducts();
}

async function showAdminUser() {
  const user = await getCurrentUser();
  const nameEls = document.querySelectorAll('.admin-user-name');
  nameEls.forEach(el => el.textContent = 'Administrador');
}

/**
 * Carga y muestra las estadísticas principales
 */
async function loadStats() {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    // Ventas del día
    const { data: todayOrders } = await _supabase
      .from('orders')
      .select('total, status')
      .gte('created_at', startOfDay)
      .neq('status', 'cancelado');

    const todaySales = todayOrders?.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) || 0;

    // Ventas del mes
    const { data: monthOrders } = await _supabase
      .from('orders')
      .select('total, status')
      .gte('created_at', startOfMonth)
      .neq('status', 'cancelado');

    const monthSales = monthOrders?.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) || 0;

    // Pedidos pendientes
    const { count: pendingCount } = await _supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendiente');

    // Total de clientes
    const { count: clientsCount } = await _supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Total de productos
    const { count: productsCount } = await _supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Actualizar UI
    setStatValue('stat-today-sales',  formatPrice(todaySales));
    setStatValue('stat-month-sales',  formatPrice(monthSales));
    setStatValue('stat-pending',      pendingCount || 0);
    setStatValue('stat-clients',      clientsCount || 0);
    setStatValue('stat-products',     productsCount || 0);
    setStatValue('stat-month-orders', monthOrders?.length || 0);

  } catch (err) {
    console.error('Error cargando estadísticas:', err);
  }
}

function setStatValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * Carga los últimos pedidos para el dashboard
 */
async function loadRecentOrders() {
  const container = document.getElementById('recent-orders-tbody');
  if (!container) return;

  try {
    const { data: orders, error } = await _supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    container.innerHTML = (orders || []).map(order => `
      <tr>
        <td><span style="font-weight:700;color:var(--color-primary);">${order.order_number}</span></td>
        <td>${order.customer_name}</td>
        <td>${formatDateTime(order.created_at)}</td>
        <td>${orderStatusBadge(order.status)}</td>
        <td style="font-weight:700;">${formatPrice(order.total)}</td>
      </tr>
    `).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);">Sin pedidos recientes.</td></tr>`;

  } catch (err) {
    console.error(err);
  }
}

/**
 * Carga los productos más vendidos
 */
async function loadTopProducts() {
  const container = document.getElementById('top-products-list');
  if (!container) return;

  try {
    const { data, error } = await _supabase
      .from('order_items')
      .select('product_name, product_image, quantity')
      .limit(50);

    if (error) throw error;

    // Agrupar por producto
    const grouped = {};
    (data || []).forEach(item => {
      const key = item.product_name;
      if (!grouped[key]) {
        grouped[key] = { name: item.product_name, image: item.product_image, total: 0 };
      }
      grouped[key].total += item.quantity;
    });

    const sorted = Object.values(grouped).sort((a, b) => b.total - a.total).slice(0, 5);

    if (!sorted.length) {
      container.innerHTML = `<p style="color:var(--color-text-muted);font-size:var(--text-sm);">Sin datos de ventas aún.</p>`;
      return;
    }

    container.innerHTML = sorted.map((p, i) => `
      <div class="top-product-item">
        <div class="top-product-rank">${i + 1}</div>
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" class="top-product-img">`
          : `<div class="top-product-img" style="background:var(--color-bg-section);display:flex;align-items:center;justify-content:center;">🎂</div>`
        }
        <div class="top-product-name">${p.name}</div>
        <div class="top-product-sales">${p.total} vendidos</div>
      </div>
    `).join('');

  } catch (err) {
    console.error(err);
  }
}

// ============================================================
// Admin — Gestión de Productos
// ============================================================

let editingProductId = null;

/**
 * Inicializa la página de productos admin
 */
async function initAdminProductsPage() {
  await requireAdmin();

  loadAdminProducts();
  initProductForm();

  // Botón nuevo producto
  const newBtn = document.getElementById('new-product-btn');
  if (newBtn) {
    newBtn.addEventListener('click', () => {
      editingProductId = null;
      resetProductForm();
      document.getElementById('product-form-title').textContent = 'Nuevo Producto';
      openModal('product-modal');
    });
  }

  // Búsqueda
  const searchInput = document.getElementById('admin-product-search');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(loadAdminProducts, 300);
    });
  }
}

/**
 * Carga todos los productos en la tabla admin
 */
async function loadAdminProducts() {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr><td colspan="7" style="text-align:center;padding:2rem;">
      <div class="loader-spinner" style="margin:0 auto;"></div>
    </td></tr>
  `;

  try {
    const search = document.getElementById('admin-product-search')?.value.trim();

    let query = _supabase.from('products').select('*').order('created_at', { ascending: false });
    if (search) query = query.ilike('name', `%${search}%`);

    const { data: products, error } = await query;
    if (error) throw error;

    if (!products?.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--color-text-muted);">Sin productos. ¡Agrega el primero!</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => {
      const stockPct = Math.min((p.stock / 20) * 100, 100);
      const stockClass = p.stock > 10 ? 'high' : p.stock > 3 ? 'medium' : 'low';

      return `
        <tr>
          <td>
            <div class="table-product-thumb">
              <img src="${p.image_url || productPlaceholderImg()}"
                   alt="${p.name}" class="table-thumb-img"
                   onerror="this.src='${productPlaceholderImg()}'">
              <div>
                <div class="table-thumb-name">${p.name}</div>
                <div class="table-thumb-cat">${p.category || '—'}</div>
              </div>
            </div>
          </td>
          <td style="font-weight:700;color:var(--color-primary);">${formatPrice(p.base_price)}</td>
          <td>
            <div class="stock-bar-wrap">
              <div class="stock-bar">
                <div class="stock-bar-fill ${stockClass}" style="width:${stockPct}%;"></div>
              </div>
              <span class="stock-count">${p.stock}</span>
            </div>
          </td>
          <td>
            <span class="badge ${p.is_available ? 'badge-success' : 'badge-error'}">
              ${p.is_available ? '✓ Disponible' : '✕ No disponible'}
            </span>
          </td>
          <td>
            <span class="badge ${p.is_featured ? 'badge-gold' : 'badge-info'}">
              ${p.is_featured ? '⭐ Sí' : 'No'}
            </span>
          </td>
          <td style="font-size:var(--text-xs);color:var(--color-text-muted);">${formatDate(p.created_at)}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-outline btn-sm" onclick="editProduct('${p.id}')">✏️ Editar</button>
              <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}', '${p.name}')">🗑</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--color-error);">Error: ${err.message}</td></tr>`;
  }
}

/**
 * Inicializa el formulario de producto (crear/editar)
 */
function initProductForm() {
  const form = document.getElementById('product-form');
  if (!form) return;

  // Image upload preview
  const imgInput = document.getElementById('product-image-input');
  if (imgInput) {
    imgInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const preview = document.getElementById('product-image-preview');
      if (preview) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
      }
    });
  }

  form.addEventListener('submit', handleProductFormSubmit);
}

/**
 * Maneja el envío del formulario de producto
 */
async function handleProductFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  if (!validateForm(form)) return;

  const btn = form.querySelector('[type="submit"]');
  setButtonLoading(btn, true);

  try {
    const imgInput = document.getElementById('product-image-input');
    let imageUrl   = document.getElementById('product-image-url')?.value || '';

    // Subir imagen si hay una nueva
    if (imgInput?.files?.length) {
      const file = imgInput.files[0];
      const ext  = file.name.split('.').pop();
      const path = `${Date.now()}.${ext}`;

      const { error: uploadError } = await _supabase.storage
        .from('products')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = _supabase.storage.from('products').getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    // Parsear opciones JSON
    const parseSafe = (str) => {
      try { return JSON.parse(str); } catch { return []; }
    };

    const productData = {
      name:         form.querySelector('#product-name').value.trim(),
      description:  form.querySelector('#product-description').value.trim(),
      base_price:   parseFloat(form.querySelector('#product-price').value),
      category:     form.querySelector('#product-category').value,
      stock:        parseInt(form.querySelector('#product-stock').value, 10),
      is_available: form.querySelector('#product-available').checked,
      is_featured:  form.querySelector('#product-featured').checked,
      image_url:    imageUrl,
      sizes:        parseSafe(form.querySelector('#product-sizes').value || '[]'),
      flavors:      parseSafe(form.querySelector('#product-flavors').value || '[]'),
      coatings:     parseSafe(form.querySelector('#product-coatings').value || '[]')
    };

    if (editingProductId) {
      // Actualizar
      const { error } = await _supabase
        .from('products')
        .update(productData)
        .eq('id', editingProductId);
      if (error) throw error;
      showToast('¡Actualizado!', 'El producto fue actualizado.', 'success');
    } else {
      // Crear
      const { error } = await _supabase.from('products').insert(productData);
      if (error) throw error;
      showToast('¡Creado!', 'El producto fue agregado al catálogo.', 'success');
    }

    closeModal('product-modal');
    loadAdminProducts();

  } catch (err) {
    console.error(err);
    showToast('Error', err.message, 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

/**
 * Abre el formulario de edición con datos existentes
 */
async function editProduct(productId) {
  editingProductId = productId;

  try {
    const product = await fetchProductById(productId);
    if (!product) throw new Error('Producto no encontrado');

    const form = document.getElementById('product-form');
    if (!form) return;

    form.querySelector('#product-name').value        = product.name || '';
    form.querySelector('#product-description').value = product.description || '';
    form.querySelector('#product-price').value       = product.base_price || '';
    form.querySelector('#product-category').value    = product.category || '';
    form.querySelector('#product-stock').value       = product.stock || 0;
    form.querySelector('#product-available').checked = product.is_available !== false;
    form.querySelector('#product-featured').checked  = product.is_featured || false;
    form.querySelector('#product-sizes').value       = JSON.stringify(product.sizes || []);
    form.querySelector('#product-flavors').value     = JSON.stringify(product.flavors || []);
    form.querySelector('#product-coatings').value    = JSON.stringify(product.coatings || []);

    const urlInput = form.querySelector('#product-image-url');
    if (urlInput) urlInput.value = product.image_url || '';

    const preview = document.getElementById('product-image-preview');
    if (preview && product.image_url) {
      preview.src = product.image_url;
      preview.style.display = 'block';
    }

    document.getElementById('product-form-title').textContent = 'Editar Producto';
    openModal('product-modal');

  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

/**
 * Elimina un producto con confirmación
 */
async function deleteProduct(productId, productName) {
  if (!confirm(`¿Estás seguro de eliminar "${productName}"? Esta acción no se puede deshacer.`)) return;

  try {
    const { error } = await _supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
    showToast('Eliminado', `"${productName}" fue eliminado.`, 'success');
    loadAdminProducts();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

/**
 * Resetea el formulario de producto
 */
function resetProductForm() {
  const form = document.getElementById('product-form');
  if (form) {
    form.reset();
    const preview = document.getElementById('product-image-preview');
    if (preview) preview.style.display = 'none';
  }
  editingProductId = null;
}

// ============================================================
// Admin — Clientes
// ============================================================

async function initAdminClientsPage() {
  await requireAdmin();

  const tbody = document.getElementById('admin-clients-tbody');
  if (!tbody) return;

  try {
    const { data, error } = await _supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data?.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--color-text-muted);">Sin clientes registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(client => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--color-accent-gold);
                        display:flex;align-items:center;justify-content:center;color:white;
                        font-weight:700;font-size:var(--text-sm);">
              ${(client.full_name || client.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style="font-weight:600;color:var(--color-primary);">${client.full_name || '—'}</div>
              <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${client.email || '—'}</div>
            </div>
          </div>
        </td>
        <td>${client.phone || '—'}</td>
        <td style="max-width:200px;font-size:var(--text-sm);">${client.address || '—'}</td>
        <td style="font-size:var(--text-xs);color:var(--color-text-muted);">${formatDate(client.created_at)}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--color-error);">Error: ${err.message}</td></tr>`;
  }
}

// ============================================================
// Admin Sidebar — toggle mobile
// ============================================================

function initAdminSidebar() {
  const toggleBtn = document.getElementById('admin-mobile-toggle');
  const sidebar   = document.querySelector('.admin-sidebar');
  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

// ============================================================
// Auto-init por página
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initAdminSidebar();

  const page = window.location.pathname.split('/').pop();
  if (page === 'dashboard.html') initDashboard();
  if (page === 'products.html')  initAdminProductsPage();
  if (page === 'orders.html')    initAdminOrdersPage();
  if (page === 'clients.html')   initAdminClientsPage();
  if (page === 'login.html' && window.location.pathname.includes('/admin/')) initAdminLoginForm();
});
