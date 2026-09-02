/* ============================================================
   CAKESPHERE — cart.js
   Gestión del carrito (localStorage + Supabase sync)
   ============================================================ */

const CART_KEY = 'cakesphere_cart';

// ============================================================
// Operaciones básicas del carrito (localStorage)
// ============================================================

/**
 * Obtiene el carrito desde localStorage
 */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Guarda el carrito en localStorage
 */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

/**
 * Agrega un ítem al carrito o incrementa su cantidad
 * @param {Object} item - { productId, name, image, price, quantity, customizations }
 */
function addToCart(item) {
  const cart = getCart();

  // Generar una clave única basada en producto + personalización
  const key = generateCartItemKey(item);
  const existing = cart.find(i => i.key === key);

  if (existing) {
    existing.quantity += item.quantity || 1;
  } else {
    cart.push({
      key,
      productId:      item.productId,
      name:           item.name,
      image:          item.image || '',
      price:          item.price,
      quantity:       item.quantity || 1,
      customizations: item.customizations || {}
    });
  }

  saveCart(cart);
  return cart;
}

/**
 * Actualiza la cantidad de un ítem
 */
function updateCartItemQty(key, quantity) {
  const cart = getCart();
  const item = cart.find(i => i.key === key);
  if (!item) return cart;

  if (quantity <= 0) {
    return removeFromCart(key);
  }
  item.quantity = quantity;
  saveCart(cart);
  return cart;
}

/**
 * Elimina un ítem del carrito por su key
 */
function removeFromCart(key) {
  const cart = getCart().filter(i => i.key !== key);
  saveCart(cart);
  return cart;
}

/**
 * Vacía el carrito
 */
function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

/**
 * Calcula el subtotal del carrito
 */
function getCartSubtotal() {
  return getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * Calcula el total (subtotal + envío)
 */
function getCartTotal() {
  return getCartSubtotal() + DELIVERY_FEE;
}

/**
 * Cuenta los ítems en el carrito
 */
function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Genera una clave única para un ítem según sus personalizaciones
 */
function generateCartItemKey(item) {
  const custStr = JSON.stringify(item.customizations || {});
  return `${item.productId}_${btoa(unescape(encodeURIComponent(custStr))).substring(0, 12)}`;
}

// ============================================================
// Renderizado del carrito
// ============================================================

/**
 * Renderiza la lista de ítems del carrito
 */
function renderCartItems() {
  const container = document.getElementById('cart-items-list');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🛒</div>
        <h3>Tu carrito está vacío</h3>
        <p>Explora nuestro catálogo y encuentra el pastel perfecto para ti.</p>
        <a href="catalog.html" class="btn btn-primary" style="margin-top: 1rem;">Ver catálogo</a>
      </div>
    `;
    updateCartSummary();
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item" data-key="${item.key}">
      <div class="cart-item-img-wrap">
        ${item.image
          ? `<img src="${item.image}" alt="${item.name}" class="cart-item-img">`
          : `<div class="cart-item-img-placeholder">🎂</div>`
        }
      </div>

      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-customizations">
          ${renderCustomizationsSummary(item.customizations)}
        </div>
        <div class="cart-item-controls">
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty('${item.key}', -1)">−</button>
            <input class="qty-input" type="number" value="${item.quantity}" min="1"
              onchange="changeQtyDirect('${item.key}', this.value)">
            <button class="qty-btn" onclick="changeQty('${item.key}', 1)">+</button>
          </div>
          <span style="color: var(--color-text-muted); font-size: var(--text-sm);">
            ${formatPrice(item.price)} c/u
          </span>
        </div>
      </div>

      <div class="cart-item-price-col">
        <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
        <button class="cart-item-remove" onclick="removeCartItem('${item.key}')">
          🗑 Eliminar
        </button>
      </div>
    </div>
  `).join('');

  updateCartSummary();
}

/**
 * Renderiza un resumen legible de las personalizaciones
 */
function renderCustomizationsSummary(customizations) {
  if (!customizations) return '';
  const parts = [];
  if (customizations.size)     parts.push(`Tamaño: ${customizations.size}`);
  if (customizations.flavor)   parts.push(`Sabor: ${customizations.flavor}`);
  if (customizations.coating)  parts.push(`Cobertura: ${customizations.coating}`);
  if (customizations.message)  parts.push(`Mensaje: "${customizations.message}"`);
  return parts.join(' · ') || 'Sin personalización';
}

/**
 * Actualiza el resumen del carrito (totales)
 */
function updateCartSummary() {
  const subtotalEl  = document.getElementById('cart-subtotal');
  const deliveryEl  = document.getElementById('cart-delivery');
  const totalEl     = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');

  const subtotal = getCartSubtotal();
  const total    = getCartTotal();
  const cart     = getCart();

  if (subtotalEl)  subtotalEl.textContent  = formatPrice(subtotal);
  if (deliveryEl)  deliveryEl.textContent  = formatPrice(DELIVERY_FEE);
  if (totalEl)     totalEl.textContent     = formatPrice(total);
  if (checkoutBtn) checkoutBtn.disabled    = cart.length === 0;
}

// ============================================================
// Acciones del carrito (llamadas desde HTML)
// ============================================================

function changeQty(key, delta) {
  const cart = getCart();
  const item = cart.find(i => i.key === key);
  if (!item) return;
  const newQty = item.quantity + delta;
  updateCartItemQty(key, newQty);
  renderCartItems();
}

function changeQtyDirect(key, value) {
  const qty = parseInt(value, 10);
  if (!qty || qty < 1) {
    renderCartItems();
    return;
  }
  updateCartItemQty(key, qty);
  updateCartSummary();
}

function removeCartItem(key) {
  removeFromCart(key);
  renderCartItems();
  showToast('Eliminado', 'El producto fue removido del carrito.', 'info');
}

// ============================================================
// Página de detalle de producto — Agregar al carrito
// ============================================================

/**
 * Inicializa el formulario de personalización y "Agregar al carrito"
 */
function initProductCustomizer() {
  const addBtn = document.getElementById('add-to-cart-btn');
  if (!addBtn) return;

  // Selección de opciones (tamaño, sabor, cobertura)
  document.querySelectorAll('.option-card').forEach(card => {
    card.addEventListener('click', () => {
      const group = card.dataset.group;
      document.querySelectorAll(`.option-card[data-group="${group}"]`)
        .forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      recalculatePrice();
    });
  });

  // Preview de imagen de referencia
  const refInput = document.getElementById('ref-image');
  if (refInput) {
    refInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const preview = document.getElementById('ref-preview');
      if (preview) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
      }
    });

    // Drag & drop
    const dropArea = document.querySelector('.image-upload-area');
    if (dropArea) {
      dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
      });
      dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));
      dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
          refInput.files = e.dataTransfer.files;
          const preview = document.getElementById('ref-preview');
          if (preview) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
          }
        }
      });
    }
  }

  // Botón agregar al carrito
  addBtn.addEventListener('click', async () => {
    const productId   = addBtn.dataset.productId;
    const productName = addBtn.dataset.productName;
    const productImg  = addBtn.dataset.productImage;

    const customizations = getSelectedCustomizations();
    const price          = getCurrentPrice();
    const qty            = parseInt(document.getElementById('product-qty')?.value || '1', 10);

    addToCart({
      productId,
      name:   productName,
      image:  productImg,
      price,
      quantity: qty,
      customizations
    });

    // Animación visual
    addBtn.textContent = '✓ Agregado';
    addBtn.classList.add('btn-success');
    addBtn.classList.remove('btn-primary');

    setTimeout(() => {
      addBtn.textContent = '🛒 Agregar al carrito';
      addBtn.classList.remove('btn-success');
      addBtn.classList.add('btn-primary');
    }, 2000);

    showToast('¡Agregado al carrito!', `${productName} fue añadido a tu carrito.`, 'success');
  });
}

/**
 * Obtiene las personalizaciones seleccionadas actualmente
 */
function getSelectedCustomizations() {
  const customizations = {};

  const size = document.querySelector('.option-card[data-group="size"].selected');
  if (size) customizations.size = size.dataset.value;

  const flavor = document.querySelector('.option-card[data-group="flavor"].selected');
  if (flavor) customizations.flavor = flavor.dataset.value;

  const coating = document.querySelector('.option-card[data-group="coating"].selected');
  if (coating) customizations.coating = coating.dataset.value;

  const message = document.getElementById('custom-message')?.value.trim();
  if (message) customizations.message = message;

  return customizations;
}

/**
 * Calcula el precio actual según opciones seleccionadas
 */
function getCurrentPrice() {
  const basePrice = parseFloat(document.getElementById('base-price')?.dataset.price || '0');
  let total = basePrice;

  document.querySelectorAll('.option-card.selected').forEach(card => {
    total += parseFloat(card.dataset.pricemod || '0');
  });

  return total;
}

/**
 * Recalcula y actualiza el precio mostrado
 */
function recalculatePrice() {
  const price = getCurrentPrice();
  const priceEl = document.getElementById('current-price');
  if (priceEl) priceEl.textContent = formatPrice(price);
}

// ============================================================
// Checkout — resumen de carrito
// ============================================================

/**
 * Renderiza el resumen del pedido en checkout
 */
function renderCheckoutSummary() {
  const container = document.getElementById('checkout-items');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
      ${item.image
        ? `<img src="${item.image}" alt="${item.name}" style="width:56px;height:56px;border-radius:10px;object-fit:cover;">`
        : `<div style="width:56px;height:56px;border-radius:10px;background:var(--color-bg-section);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🎂</div>`
      }
      <div style="flex:1;">
        <div style="font-weight:600;color:var(--color-primary);font-size:var(--text-sm);">${item.name}</div>
        <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${renderCustomizationsSummary(item.customizations)}</div>
        <div style="font-size:var(--text-xs);color:var(--color-text-muted);">x${item.quantity}</div>
      </div>
      <div style="font-weight:700;color:var(--color-primary);font-size:var(--text-sm);">${formatPrice(item.price * item.quantity)}</div>
    </div>
  `).join('');

  updateCartSummary();
}

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  renderCartItems();
  renderCheckoutSummary();
  initProductCustomizer();
});
