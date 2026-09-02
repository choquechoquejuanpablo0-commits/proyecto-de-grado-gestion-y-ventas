/* ============================================================
   CAKESPHERE — products.js
   Carga y renderizado de productos desde Supabase
   ============================================================ */

let allProducts = [];   // Cache de productos
let currentPage  = 1;
const PAGE_SIZE  = 9;

// ============================================================
// Fetch de productos
// ============================================================

/**
 * Obtiene todos los productos disponibles
 */
async function fetchProducts(filters = {}) {
  let query = _supabase
    .from('products')
    .select('*')
    .eq('is_available', true)
    .order('created_at', { ascending: false });

  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.featured) {
    query = query.eq('is_featured', true);
  }
  if (filters.minPrice) {
    query = query.gte('base_price', filters.minPrice);
  }
  if (filters.maxPrice) {
    query = query.lte('base_price', filters.maxPrice);
  }
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }
  if (filters.sort === 'price_asc') {
    query = query.order('base_price', { ascending: true });
  } else if (filters.sort === 'price_desc') {
    query = query.order('base_price', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Obtiene un producto por ID
 */
async function fetchProductById(id) {
  const { data, error } = await _supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Obtiene productos destacados para el home
 */
async function fetchFeaturedProducts() {
  const { data, error } = await _supabase
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .eq('is_available', true)
    .limit(3);

  if (error) throw error;
  return data || [];
}

// ============================================================
// Renderizado — Tarjetas de producto
// ============================================================

/**
 * Genera el HTML de una card de producto
 */
function renderProductCard(product) {
  const isOutOfStock = product.stock <= 0;
  const imageUrl     = product.image_url || productPlaceholderImg();

  return `
    <div class="card ${isOutOfStock ? 'out-of-stock' : ''}" style="position:relative;">
      <div class="card-img-wrap" style="position:relative;">
        <img
          src="${imageUrl}"
          alt="${product.name}"
          class="card-img"
          onerror="this.src='${productPlaceholderImg()}'"
          loading="lazy"
        >
        <div class="card-badge">
          ${isOutOfStock
            ? `<span class="badge badge-error">Agotado</span>`
            : product.stock <= 3
              ? `<span class="badge badge-warning">¡Últimas ${product.stock}!</span>`
              : product.is_featured
                ? `<span class="badge badge-gold">⭐ Destacado</span>`
                : ''
          }
        </div>
      </div>

      <div class="card-body">
        <div style="font-size:var(--text-xs);color:var(--color-accent-gold);font-weight:600;
                    letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">
          ${product.category || 'Pastel'}
        </div>
        <div class="card-title">${product.name}</div>
        <div class="card-desc">${product.description || 'Delicioso pastel artesanal hecho con ingredientes de primera calidad.'}</div>
      </div>

      <div class="card-footer">
        <div>
          <div class="card-price-label">Desde</div>
          <div class="card-price">${formatPrice(product.base_price)}</div>
        </div>
        ${isOutOfStock
          ? `<button class="btn btn-outline btn-sm" disabled>Agotado</button>`
          : `<a href="product.html?id=${product.id}" class="btn btn-primary btn-sm">
               Ver detalles
             </a>`
        }
      </div>
    </div>
  `;
}

// ============================================================
// Página: Catálogo
// ============================================================

/**
 * Inicializa la página de catálogo
 */
async function initCatalogPage() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  renderProductSkeletons(grid, 9);

  try {
    allProducts = await fetchProducts();
    renderCatalog(allProducts);
    initCatalogFilters();
  } catch (err) {
    console.error('Error cargando productos:', err);
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">😕</div>
        <h3>No pudimos cargar los productos</h3>
        <p>Por favor, verifica tu conexión o intenta más tarde.</p>
        <button class="btn btn-primary" onclick="initCatalogPage()">Reintentar</button>
      </div>
    `;
  }
}

/**
 * Renderiza el grid de productos filtrado
 */
function renderCatalog(products) {
  const grid    = document.getElementById('products-grid');
  const countEl = document.getElementById('products-count');

  if (countEl) {
    countEl.textContent = `${products.length} producto${products.length !== 1 ? 's' : ''} encontrado${products.length !== 1 ? 's' : ''}`;
  }

  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">🔍</div>
        <h3>Sin resultados</h3>
        <p>No encontramos productos con esos filtros. ¡Prueba con otros!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(p => renderProductCard(p)).join('');
}

/**
 * Inicializa filtros del catálogo
 */
function initCatalogFilters() {
  // Filtros de categoría (chips)
  document.querySelectorAll('.filter-chip[data-category]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-category]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      applyFilters();
    });
  });

  // Ordenamiento
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', applyFilters);
  }

  // Búsqueda
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyFilters, 350);
    });
  }

  // Filtro de precio
  const priceMin = document.getElementById('price-min');
  const priceMax = document.getElementById('price-max');
  if (priceMin) priceMin.addEventListener('change', applyFilters);
  if (priceMax) priceMax.addEventListener('change', applyFilters);

  // Limpiar filtros
  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      if (sortSelect) sortSelect.value = 'default';
      if (searchInput) searchInput.value = '';
      if (priceMin) priceMin.value = '';
      if (priceMax) priceMax.value = '';
      renderCatalog(allProducts);
    });
  }
}

/**
 * Aplica los filtros activos y re-renderiza el catálogo
 */
function applyFilters() {
  let filtered = [...allProducts];

  // Categoría
  const activeCategory = document.querySelector('.filter-chip[data-category].active')?.dataset.category;
  if (activeCategory && activeCategory !== 'all') {
    filtered = filtered.filter(p => p.category === activeCategory);
  }

  // Búsqueda
  const search = document.getElementById('search-input')?.value.trim().toLowerCase();
  if (search) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.description?.toLowerCase().includes(search)
    );
  }

  // Precio
  const minPrice = parseFloat(document.getElementById('price-min')?.value);
  const maxPrice = parseFloat(document.getElementById('price-max')?.value);
  if (!isNaN(minPrice)) filtered = filtered.filter(p => p.base_price >= minPrice);
  if (!isNaN(maxPrice)) filtered = filtered.filter(p => p.base_price <= maxPrice);

  // Ordenamiento
  const sort = document.getElementById('sort-select')?.value;
  if (sort === 'price_asc')  filtered.sort((a,b) => a.base_price - b.base_price);
  if (sort === 'price_desc') filtered.sort((a,b) => b.base_price - a.base_price);
  if (sort === 'name_asc')   filtered.sort((a,b) => a.name.localeCompare(b.name));
  if (sort === 'featured')   filtered.sort((a,b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));

  renderCatalog(filtered);
}

// ============================================================
// Página: Detalle de producto
// ============================================================

/**
 * Inicializa la página de detalle de producto
 */
async function initProductDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    window.location.href = 'catalog.html';
    return;
  }

  try {
    const product = await fetchProductById(productId);
    if (!product) throw new Error('Producto no encontrado');

    renderProductDetail(product);
    initProductGallery(product);
    initProductTabs();
    setupAddToCartBtn(product);

  } catch (err) {
    console.error('Error cargando producto:', err);
    document.getElementById('product-detail-area').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">😕</div>
        <h3>Producto no encontrado</h3>
        <p>El producto que buscas no existe o fue eliminado.</p>
        <a href="catalog.html" class="btn btn-primary">Ver catálogo</a>
      </div>
    `;
  }
}

/**
 * Renderiza el detalle de un producto
 */
function renderProductDetail(product) {
  // Título y meta
  document.title = `${product.name} — CakeSphere`;

  // Breadcrumb
  const bc = document.getElementById('breadcrumb-product');
  if (bc) bc.textContent = product.name;

  // Categoría
  const catEl = document.getElementById('product-category');
  if (catEl) catEl.textContent = product.category || 'Pastel';

  // Título
  const titleEl = document.getElementById('product-title');
  if (titleEl) titleEl.textContent = product.name;

  // Precio base
  const priceEl = document.getElementById('current-price');
  if (priceEl) priceEl.textContent = formatPrice(product.base_price);

  const basePriceEl = document.getElementById('base-price');
  if (basePriceEl) basePriceEl.dataset.price = product.base_price;

  // Stock
  const stockEl = document.getElementById('product-stock');
  if (stockEl) {
    if (product.stock <= 0) {
      stockEl.innerHTML = `<span class="badge badge-error">Agotado</span>`;
    } else if (product.stock <= 5) {
      stockEl.innerHTML = `<span class="badge badge-warning">¡Solo ${product.stock} disponibles!</span>`;
    } else {
      stockEl.innerHTML = `<span class="badge badge-success">✓ En stock (${product.stock})</span>`;
    }
  }

  // Descripción
  const descEl = document.getElementById('product-description');
  if (descEl) descEl.innerHTML = product.description || 'Sin descripción disponible.';

  // Imagen principal
  const mainImg = document.getElementById('product-main-img');
  if (mainImg) {
    mainImg.src = product.image_url || productPlaceholderImg();
    mainImg.alt = product.name;
  }

  // Opciones de tamaño
  renderOptions('size', product.sizes || [], 'size-options');

  // Opciones de sabor
  renderOptions('flavor', product.flavors || [], 'flavor-options');

  // Opciones de cobertura
  renderOptions('coating', product.coatings || [], 'coating-options');

  // Deshabilitar si agotado
  if (product.stock <= 0) {
    const addBtn = document.getElementById('add-to-cart-btn');
    if (addBtn) {
      addBtn.disabled = true;
      addBtn.textContent = 'Sin stock disponible';
    }
  }
}

/**
 * Renderiza opciones de personalización
 */
function renderOptions(group, options, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!options || !options.length) {
    container.closest('.custom-section')?.remove();
    return;
  }

  container.innerHTML = options.map((opt, i) => `
    <label class="option-card ${i === 0 ? 'selected' : ''}"
           data-group="${group}"
           data-value="${opt.name}"
           data-pricemod="${opt.price_mod || 0}">
      <input type="radio" name="${group}" value="${opt.name}" ${i === 0 ? 'checked' : ''}>
      <span>${opt.name}</span>
      ${opt.price_mod > 0 ? `<span style="color:var(--color-accent-gold);font-size:10px;">+${formatPrice(opt.price_mod)}</span>` : ''}
    </label>
  `).join('');

  // Selección al hacer click
  container.querySelectorAll('.option-card').forEach(card => {
    card.addEventListener('click', () => {
      container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      recalculatePrice();
    });
  });
}

/**
 * Inicializa la galería de imágenes del producto
 */
function initProductGallery(product) {
  const thumbContainer = document.getElementById('product-thumbnails');
  const mainImg = document.getElementById('product-main-img');
  if (!thumbContainer || !mainImg) return;

  const images = [product.image_url, ...(product.images || [])].filter(Boolean);
  if (images.length <= 1) {
    thumbContainer.style.display = 'none';
    return;
  }

  thumbContainer.innerHTML = images.map((img, i) => `
    <div class="product-thumb ${i === 0 ? 'active' : ''}" onclick="switchImage('${img}', this)">
      <img src="${img}" alt="Vista ${i+1}" loading="lazy">
    </div>
  `).join('');
}

function switchImage(src, thumbEl) {
  const mainImg = document.getElementById('product-main-img');
  if (mainImg) mainImg.src = src;
  document.querySelectorAll('.product-thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
}

/**
 * Inicializa las tabs del producto
 */
function initProductTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(btn.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });
}

/**
 * Configura el botón de agregar al carrito
 */
function setupAddToCartBtn(product) {
  const btn = document.getElementById('add-to-cart-btn');
  if (!btn) return;
  btn.dataset.productId    = product.id;
  btn.dataset.productName  = product.name;
  btn.dataset.productImage = product.image_url || '';
}

// ============================================================
// Página: Home — productos destacados
// ============================================================

async function initHomeFeatured() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  renderProductSkeletons(grid, 3);

  try {
    const products = await fetchFeaturedProducts();

    if (!products.length) {
      // Si no hay destacados, cargamos los primeros 3
      const all = await fetchProducts();
      renderFeaturedGrid(all.slice(0, 3));
    } else {
      renderFeaturedGrid(products);
    }
  } catch (err) {
    console.error(err);
    grid.innerHTML = '';
  }
}

function renderFeaturedGrid(products) {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  grid.innerHTML = products.map(p => renderProductCard(p)).join('');
}

// Auto-init según la página actual
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();
  if (page === 'catalog.html' || page === 'catalog')   initCatalogPage();
  if (page === 'product.html' || page === 'product')   initProductDetailPage();
  if (page === 'index.html'   || page === '' || page === 'index') initHomeFeatured();
});
