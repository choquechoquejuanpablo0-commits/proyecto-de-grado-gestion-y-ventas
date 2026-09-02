/* ============================================================
   CAKESPHERE — ui.js
   Utilidades de interfaz: toast, loader, modal, formato
   ============================================================ */

/**
 * Muestra una notificación toast
 * @param {string} title   - Título del toast
 * @param {string} message - Mensaje descriptivo
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} duration - Duración en ms (default 4000)
 */
function showToast(title, message = '', type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="removeToast(this.parentElement)">✕</button>
  `;

  container.appendChild(toast);

  // Auto-remove
  const timer = setTimeout(() => removeToast(toast), duration);
  toast._timer = timer;

  return toast;
}

/**
 * Elimina un toast con animación
 */
function removeToast(toast) {
  if (!toast || !toast.parentElement) return;
  clearTimeout(toast._timer);
  toast.classList.add('removing');
  setTimeout(() => toast.remove(), 300);
}

/**
 * Muestra el loader global
 */
function showLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.classList.remove('hide');
    loader.style.pointerEvents = 'all';
  }
}

/**
 * Oculta el loader global
 */
function hideLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.classList.add('hide');
    setTimeout(() => {
      loader.style.pointerEvents = 'none';
    }, 400);
  }
}

/**
 * Abre un modal por su ID
 */
function openModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Cerrar al hacer click en el overlay
  overlay.addEventListener('click', function handler(e) {
    if (e.target === overlay) {
      closeModal(modalId);
      overlay.removeEventListener('click', handler);
    }
  });
}

/**
 * Cierra un modal por su ID
 */
function closeModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

/**
 * Formatea un número como precio
 * @param {number} amount
 * @returns {string}
 */
function formatPrice(amount) {
  return `${Number(amount).toFixed(2)} ${CURRENCY}`;
}

/**
 * Formatea una fecha en formato legible
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PE', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

/**
 * Formatea una fecha y hora
 */
function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PE', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/**
 * Genera las estrellas de rating como HTML
 */
function renderStars(rating = 5) {
  let html = '<div class="stars">';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="${i <= rating ? '' : 'star-empty'}">★</span>`;
  }
  html += '</div>';
  return html;
}

/**
 * Badge de estado de pedido
 */
function orderStatusBadge(status) {
  const map = {
    pendiente:        { class: 'badge-pending',  label: '⏳ Pendiente' },
    en_preparacion:   { class: 'badge-warning',  label: '🍳 En preparación' },
    listo:            { class: 'badge-info',     label: '✅ Listo' },
    entregado:        { class: 'badge-success',  label: '🎉 Entregado' },
    cancelado:        { class: 'badge-error',    label: '✕ Cancelado' }
  };
  const s = map[status] || { class: 'badge-info', label: status };
  return `<span class="badge ${s.class}">${s.label}</span>`;
}

/**
 * Valida un formulario HTML5 y muestra errores visuales
 * @returns {boolean} válido o no
 */
function validateForm(formEl) {
  let isValid = true;
  const inputs = formEl.querySelectorAll('[required]');

  inputs.forEach(input => {
    const errorEl = input.parentElement.querySelector('.form-error');
    input.classList.remove('error');
    if (errorEl) errorEl.textContent = '';

    if (!input.value.trim()) {
      input.classList.add('error');
      isValid = false;
      if (errorEl) errorEl.textContent = 'Este campo es obligatorio.';
    } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
      input.classList.add('error');
      isValid = false;
      if (errorEl) errorEl.textContent = 'Introduce un email válido.';
    } else if (input.minLength && input.value.length < input.minLength) {
      input.classList.add('error');
      isValid = false;
      if (errorEl) errorEl.textContent = `Mínimo ${input.minLength} caracteres.`;
    }
  });

  if (!isValid) {
    const firstError = formEl.querySelector('.form-input.error, .form-select.error, .form-textarea.error');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return isValid;
}

/**
 * Activa estado loading en un botón
 */
function setButtonLoading(btn, loading = true) {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    if (btn.dataset.originalText) btn.innerHTML = btn.dataset.originalText;
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

/**
 * Genera un número de orden único
 */
function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random    = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SWX-${timestamp}-${random}`;
}

/**
 * Render de un skeleton placeholder para productos
 */
function renderProductSkeletons(container, count = 6) {
  container.innerHTML = Array(count).fill(0).map(() => `
    <div class="card">
      <div class="skeleton" style="height: 240px; border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;"></div>
      <div class="card-body">
        <div class="skeleton" style="height: 22px; width: 70%; margin-bottom: 10px;"></div>
        <div class="skeleton" style="height: 14px; width: 90%; margin-bottom: 6px;"></div>
        <div class="skeleton" style="height: 14px; width: 60%;"></div>
      </div>
      <div class="card-footer">
        <div class="skeleton" style="height: 28px; width: 80px;"></div>
        <div class="skeleton" style="height: 38px; width: 120px; border-radius: 12px;"></div>
      </div>
    </div>
  `).join('');
}

/**
 * Imagen placeholder cuando no hay imagen de producto
 */
function productPlaceholderImg() {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23F5F0EA' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='64' fill='%23C9A96E' opacity='0.4'%3E🎂%3C/text%3E%3C/svg%3E`;
}

/**
 * Inicializa la navbar (scroll + hamburger)
 */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  // Scroll behavior
  const handleScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
      navbar.classList.remove('transparent');
    } else if (navbar.dataset.transparent === 'true') {
      navbar.classList.remove('scrolled');
      navbar.classList.add('transparent');
    }
  };

  if (navbar.dataset.transparent === 'true') {
    navbar.classList.add('transparent');
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Hamburger
  const hamburger = document.querySelector('.hamburger');
  const links = document.querySelector('.navbar-links');
  if (hamburger && links) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      links.classList.toggle('open');
    });
  }

  // Active link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-link').forEach(link => {
    const href = link.getAttribute('href')?.split('/').pop();
    if (href === currentPath) link.classList.add('active');
  });
}

/**
 * Actualiza el contador del carrito en la navbar
 */
function updateCartBadge() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.querySelector('.cart-count');
  if (badge) {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
  }
}

/**
 * Inicia la página con animación de entrada
 */
function initPageEnter() {
  document.body.classList.add('page-enter');
}

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  hideLoader();
  initNavbar();
  updateCartBadge();
  initPageEnter();
});
