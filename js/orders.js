/* ============================================================
   CAKESPHERE — orders.js
   Creación, consulta y gestión de pedidos con Supabase
   ============================================================ */

// ============================================================
// Checkout — Crear pedido
// ============================================================

/**
 * Inicializa el formulario de checkout
 */
function initCheckoutForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  const cart = getCart();
  if (!cart.length) {
    window.location.href = 'cart.html';
    return;
  }

  // Autocompletar con datos de perfil si está logueado
  getCurrentUser().then(async user => {
    if (user) {
      const profile = await getUserProfile();
      if (profile) {
        const nameInput = form.querySelector('#customer-name');
        const phoneInput = form.querySelector('#customer-phone');
        const addressInput = form.querySelector('#delivery-address');
        if (nameInput && !nameInput.value)    nameInput.value   = profile.full_name || '';
        if (phoneInput && !phoneInput.value)  phoneInput.value  = profile.phone || '';
        if (addressInput && !addressInput.value) addressInput.value = profile.address || '';
      }
    }
  }).catch(() => {});

  // Métodos de pago
  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const input = opt.querySelector('input');
      if (input) input.checked = true;
    });
  });

  // Seleccionar primer método por defecto
  const firstPayment = document.querySelector('.payment-option');
  if (firstPayment) firstPayment.click();

  form.addEventListener('submit', handleCheckoutSubmit);
}

/**
 * Maneja el envío del formulario de checkout
 */
async function handleCheckoutSubmit(e) {
  e.preventDefault();
  const form = e.target;
  if (!validateForm(form)) return;

  const btn = form.querySelector('[type="submit"]');
  setButtonLoading(btn, true);

  try {
    const user = await getCurrentUser();

        // Recoger datos del formulario
    const orderId = crypto.randomUUID();

    const orderData = {
      id:               orderId,
      order_number:     generateOrderNumber(),
      user_id:          user?.id || null,
      customer_name:    form.querySelector('#customer-name').value.trim(),
      customer_email:   form.querySelector('#customer-email').value.trim(),
      customer_phone:   form.querySelector('#customer-phone').value.trim(),
      delivery_address: form.querySelector('#delivery-address').value.trim(),
      delivery_date:    form.querySelector('#delivery-date').value || null,
      payment_method:   document.querySelector('.payment-option.selected input')?.value || 'efectivo',
      notes:            form.querySelector('#order-notes')?.value.trim() || '',
      subtotal:         getCartSubtotal(),
      delivery_fee:     DELIVERY_FEE,
      total:            getCartTotal(),
      status:           'pendiente'
    };

    const cart = getCart();

    // Insertar pedido en Supabase (sin pedir que devuelva la fila)
    const { error: orderError } = await _supabase
      .from('orders')
      .insert(orderData);

    if (orderError) throw orderError;

    const order = orderData;

    // Insertar items del pedido
    const items = cart.map(item => ({
      order_id:      order.id,
      product_id:    item.productId,
      product_name:  item.name,
      product_image: item.image || null,
      quantity:      item.quantity,
      unit_price:    item.price,
      customizations: item.customizations || {},
      subtotal:      item.price * item.quantity
    }));

    const { error: itemsError } = await _supabase
      .from('order_items')
      .insert(items);

    if (itemsError) throw itemsError;

    // Actualizar stock de productos
for (const item of cart) {
  try {
    const { error: stockError } = await _supabase.rpc('decrement_stock', {
      p_product_id: item.productId,
      p_quantity:   item.quantity
    });
    if (stockError) throw stockError;
  } catch (err) {
    // Si la función RPC no existe (o falla), hacemos update manual
    try {
      const { error: manualError } = await _supabase.rpc('update_stock_manual', {
        pid: item.productId,
        qty: item.quantity
      });
      if (manualError) console.warn('No se pudo actualizar stock manualmente:', manualError);
    } catch (err2) {
      console.warn('No se pudo actualizar el stock de', item.productId, err2);
    }
  }
}

    // Limpiar carrito
    clearCart();

    // Guardar número de orden para la página de éxito
    localStorage.setItem('last_order_number', order.order_number);
    localStorage.setItem('last_order_id',     order.id);

    // Redirigir a página de éxito
    window.location.href = `order-success.html?order=${order.order_number}`;

  } catch (err) {
    console.error('Error creando pedido:', err);
    setButtonLoading(btn, false);
    showToast('Error al procesar el pedido', err.message || 'Intenta de nuevo.', 'error');
  }
}

// ============================================================
// Página de éxito del pedido
// ============================================================

function initOrderSuccessPage() {
  const params      = new URLSearchParams(window.location.search);
  const orderNumber = params.get('order') || localStorage.getItem('last_order_number');

  const orderEl = document.getElementById('success-order-number');
  if (orderEl && orderNumber) {
    orderEl.textContent = orderNumber;
  }

  // Limpiar localStorage
  localStorage.removeItem('last_order_number');
  localStorage.removeItem('last_order_id');
}

// ============================================================
// Historial de pedidos del cliente
// ============================================================

/**
 * Carga y renderiza el historial de pedidos del usuario actual
 */
async function initOrdersPage() {
  const container = document.getElementById('orders-list');
  if (!container) return;

  // Verificar sesión
  const user = await requireAuth('login.html');
  if (!user) return;

  // Mostrar nombre en sidebar
  const profile = await getUserProfile();
  const nameEl  = document.getElementById('account-name');
  const emailEl = document.getElementById('account-email');
  const avatarEl = document.getElementById('account-avatar');

  if (nameEl)   nameEl.textContent  = profile?.full_name || user.email.split('@')[0];
  if (emailEl)  emailEl.textContent = user.email;
  if (avatarEl) avatarEl.textContent = (profile?.full_name || user.email)[0].toUpperCase();

  // Skeleton
  container.innerHTML = `
    <div class="skeleton" style="height:120px;border-radius:var(--radius-xl);margin-bottom:12px;"></div>
    <div class="skeleton" style="height:120px;border-radius:var(--radius-xl);margin-bottom:12px;"></div>
  `;

  try {
    // Cargar pedidos
    const { data: orders, error } = await _supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id, product_name, product_image, quantity, unit_price, subtotal
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!orders || !orders.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h3>Aún no tienes pedidos</h3>
          <p>Cuando realices tu primer pedido, aparecerá aquí.</p>
          <a href="catalog.html" class="btn btn-primary" style="margin-top:1rem;">Ver catálogo</a>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map(order => renderOrderCard(order)).join('');

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">😕</div>
        <h3>Error cargando pedidos</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}

/**
 * Genera el HTML de una tarjeta de pedido
 */
function renderOrderCard(order) {
  const items = order.order_items || [];

  return `
    <div class="order-card">
      <div class="order-card-header">
        <div>
          <div class="order-number">${order.order_number}</div>
          <div class="order-date">${formatDateTime(order.created_at)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          ${orderStatusBadge(order.status)}
        </div>
      </div>

      <div class="order-card-items">
        ${items.slice(0, 3).map(item => `
          <div class="order-item-row">
            ${item.product_image
              ? `<img src="${item.product_image}" alt="${item.product_name}">`
              : `<div style="width:40px;height:40px;border-radius:8px;background:var(--color-bg-section);display:flex;align-items:center;justify-content:center;">🎂</div>`
            }
            <span style="flex:1;">${item.product_name}</span>
            <span style="color:var(--color-text-muted);">x${item.quantity}</span>
            <span style="font-weight:600;">${formatPrice(item.subtotal)}</span>
          </div>
        `).join('')}
        ${items.length > 3
          ? `<p style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:8px;">
               + ${items.length - 3} producto(s) más
             </p>`
          : ''
        }
      </div>

      <div class="order-card-footer">
        <div>
          <span style="font-size:var(--text-xs);color:var(--color-text-muted);">Entrega:</span>
          <span style="font-size:var(--text-sm);margin-left:4px;">
            ${order.delivery_date ? formatDate(order.delivery_date) : 'Por coordinar'}
          </span>
        </div>
        <div class="order-total">Total: ${formatPrice(order.total)}</div>
      </div>
    </div>
  `;
}

// ============================================================
// Admin — Gestión de pedidos
// ============================================================

/**
 * Carga todos los pedidos para el panel admin
 */
async function fetchAllOrders(filters = {}) {
  let query = _supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id, product_name, product_image, quantity, unit_price, subtotal, customizations
      )
    `)
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.search) {
    query = query.ilike('order_number', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Actualiza el estado de un pedido (admin)
 */
async function updateOrderStatus(orderId, newStatus) {
  const { error } = await _supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) throw error;
}

/**
 * Inicializa la página de pedidos del admin
 */
async function initAdminOrdersPage() {
  const container = document.getElementById('admin-orders-table');
  if (!container) return;

  await requireAdmin();

  // Filtro por estado
  const statusFilter = document.getElementById('order-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => loadAdminOrders());
  }

  loadAdminOrders();
}

async function loadAdminOrders() {
  const container = document.getElementById('admin-orders-tbody');
  if (!container) return;

  const statusFilter = document.getElementById('order-status-filter')?.value || 'all';

  container.innerHTML = `
    <tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--color-text-muted);">
      <div class="loader-spinner" style="margin:0 auto;"></div>
    </td></tr>
  `;

  try {
    const orders = await fetchAllOrders({ status: statusFilter === 'all' ? null : statusFilter });

    if (!orders.length) {
      container.innerHTML = `
        <tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--color-text-muted);">
          No hay pedidos para mostrar.
        </td></tr>
      `;
      return;
    }

    container.innerHTML = orders.map(order => `
      <tr>
        <td>
          <span style="font-weight:700;color:var(--color-primary);">${order.order_number}</span>
          <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${formatDateTime(order.created_at)}</div>
        </td>
        <td>
          <div style="font-weight:500;">${order.customer_name}</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${order.customer_email || ''}</div>
        </td>
        <td style="font-size:var(--text-sm);">
          ${(order.order_items || []).length} ítem(s)
        </td>
        <td>
          <div style="font-weight:700;color:var(--color-primary);">${formatPrice(order.total)}</div>
        </td>
        <td>${order.delivery_date ? formatDate(order.delivery_date) : '—'}</td>
        <td>
          <select class="order-status-select" onchange="changeOrderStatus('${order.id}', this.value)">
            ${['pendiente','en_preparacion','listo','entregado','cancelado'].map(s =>
              `<option value="${s}" ${order.status === s ? 'selected' : ''}>${
                {pendiente:'Pendiente',en_preparacion:'En preparación',listo:'Listo',entregado:'Entregado',cancelado:'Cancelado'}[s]
              }</option>`
            ).join('')}
          </select>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-outline btn-sm" onclick="viewOrderDetail('${order.id}')">👁 Ver</button>
          </div>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--color-error);">
        Error: ${err.message}
      </td></tr>
    `;
  }
}

/**
 * Cambia el estado de un pedido desde la tabla admin
 */
async function changeOrderStatus(orderId, newStatus) {
  try {
    await updateOrderStatus(orderId, newStatus);
    showToast('Estado actualizado', 'El pedido fue actualizado correctamente.', 'success');
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

/**
 * Abre el detalle de un pedido (admin)
 */
async function viewOrderDetail(orderId) {
  // Se podría abrir un modal con detalles completos
  showToast('Info', `Abriendo pedido ${orderId}...`, 'info');
  // TODO: Implementar modal de detalle de pedido
}

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();
  if (page === 'checkout.html')      initCheckoutForm();
  if (page === 'order-success.html') initOrderSuccessPage();
  if (page === 'orders.html' && !window.location.pathname.includes('/admin/')) initOrdersPage();
  if (page === 'orders.html' && window.location.pathname.includes('/admin/'))  initAdminOrdersPage();
});