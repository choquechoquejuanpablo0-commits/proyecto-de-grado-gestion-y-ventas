/* ============================================================
   CAKESPHERE — auth.js
   Autenticación de clientes y admin con Supabase
   ============================================================ */

/**
 * Obtiene la sesión actual
 */
async function getCurrentSession() {
  const { data: { session } } = await _supabase.auth.getSession();
  return session;
}

/**
 * Obtiene el usuario actual
 */
async function getCurrentUser() {
  const { data: { user } } = await _supabase.auth.getUser();
  return user;
}

/**
 * Verifica si el usuario actual es admin
 */
async function isAdmin() {
  const user = await getCurrentUser();
  return user?.email === ADMIN_EMAIL;
}

/**
 * Registra un nuevo cliente
 * @param {string} email
 * @param {string} password
 * @param {string} fullName
 * @param {string} phone
 */
async function registerUser(email, password, fullName, phone = '') {
  const { data, error } = await _supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone }
    }
  });

  if (error) throw error;

  // El perfil en la tabla 'profiles' ahora lo crea automáticamente
  // un trigger en la base de datos (handle_new_user), así que no
  // hace falta insertarlo aquí manualmente. Esto evita que falle
  // por RLS cuando todavía no hay sesión activa (p. ej. si el
  // proyecto exige confirmar el email antes de iniciar sesión).

  return data;
}

/**
 * Inicia sesión con email y contraseña
 */
async function loginUser(email, password) {
  const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Cierra la sesión actual
 */
async function logoutUser() {
  const { error } = await _supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Actualiza el perfil del usuario
 */
async function updateProfile(updates) {
  const user = await getCurrentUser();
  if (!user) throw new Error('No hay sesión activa');

  const { error } = await _supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) throw error;
}

/**
 * Obtiene el perfil del usuario actual
 */
async function getUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await _supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data;
}

/**
 * Redirige a login si no hay sesión
 * @param {string} redirect - URL a redirigir después de login
 */
async function requireAuth(redirect = 'login.html') {
  const user = await getCurrentUser();
  if (!user) {
    const current = encodeURIComponent(window.location.href);
    window.location.href = `${redirect}?redirect=${current}`;
    return null;
  }
  return user;
}

/**
 * Redirige si no es admin
 */
async function requireAdmin() {
  const user = await getCurrentUser();
  const admin = user?.email === ADMIN_EMAIL;
  if (!admin) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

/**
 * Actualiza el estado de la navbar según la sesión
 */
async function updateAuthNavbar() {
  const user = await getCurrentUser();
  const loginLink  = document.getElementById('nav-login');
  const logoutLink = document.getElementById('nav-logout');
  const profileLink = document.getElementById('nav-profile');

  if (user) {
    if (loginLink)  loginLink.style.display  = 'none';
    if (logoutLink) logoutLink.style.display = 'inline-flex';
    if (profileLink) profileLink.style.display = 'inline-flex';
  } else {
    if (loginLink)  loginLink.style.display  = 'inline-flex';
    if (logoutLink) logoutLink.style.display = 'none';
    if (profileLink) profileLink.style.display = 'none';
  }
}

// ============================================================
// Formularios de Login / Registro
// ============================================================

/**
 * Maneja el formulario de login de clientes
 */
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;

    const email    = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    const btn      = form.querySelector('[type="submit"]');

    setButtonLoading(btn, true);

    try {
      await loginUser(email, password);
      showToast('¡Bienvenido!', 'Has iniciado sesión correctamente.', 'success');

      // Redirigir
      const params   = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      setTimeout(() => {
        window.location.href = redirect || 'index.html';
      }, 1000);

    } catch (err) {
      setButtonLoading(btn, false);
      let msg = err.message;
      if (msg.includes('Invalid login') || msg.includes('invalid')) {
        msg = 'Email o contraseña incorrectos.';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada (y la carpeta de spam).';
      }
      showToast('Error al iniciar sesión', msg, 'error');
    }
  });
}

/**
 * Maneja el formulario de registro de clientes
 */
function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;

    const fullName = form.querySelector('#fullname').value.trim();
    const email    = form.querySelector('#email').value.trim();
    const phone    = form.querySelector('#phone')?.value.trim() || '';
    const password = form.querySelector('#password').value;
    const confirm  = form.querySelector('#confirm-password').value;
    const btn      = form.querySelector('[type="submit"]');

    if (password !== confirm) {
      form.querySelector('#confirm-password').classList.add('error');
      const errEl = form.querySelector('#confirm-password-error');
      if (errEl) errEl.textContent = 'Las contraseñas no coinciden.';
      return;
    }

    if (password.length < 6) {
      form.querySelector('#password').classList.add('error');
      const errEl = form.querySelector('#password-error');
      if (errEl) errEl.textContent = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    setButtonLoading(btn, true);

    try {
      await registerUser(email, password, fullName, phone);
      showToast('¡Cuenta creada!', 'Revisa tu email para confirmar tu cuenta.', 'success');
      setTimeout(() => {
        window.location.href = 'login.html?registered=1';
      }, 1500);
    } catch (err) {
      setButtonLoading(btn, false);
      const msg = err.message.includes('already registered')
        ? 'Este email ya está registrado.'
        : err.message;
      showToast('Error al registrarse', msg, 'error');
    }
  });
}

/**
 * Maneja el formulario de login del admin
 */
function initAdminLoginForm() {
  const form = document.getElementById('admin-login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;

    const email    = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    const btn      = form.querySelector('[type="submit"]');

    setButtonLoading(btn, true);

    try {
      const { user } = await loginUser(email, password);

      if (user?.email !== ADMIN_EMAIL) {
        await logoutUser();
        throw new Error('Acceso no autorizado. Solo administradores pueden acceder.');
      }

      showToast('¡Bienvenido, Admin!', 'Redirigiendo al panel...', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);

    } catch (err) {
      setButtonLoading(btn, false);
      showToast('Acceso denegado', err.message, 'error');
    }
  });
}

/**
 * Botón de cerrar sesión
 */
function initLogoutBtn() {
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await logoutUser();
        const enAdmin = window.location.pathname.includes('/admin/');
        window.location.href = enAdmin ? '../index.html' : 'index.html';
      } catch (err) {
        showToast('Error', 'No se pudo cerrar sesión.', 'error');
      }
    });
  });
}

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initRegisterForm();
  initAdminLoginForm();
  initLogoutBtn();
  updateAuthNavbar();
});