# 🎂 CAKESPHERE — Guía de Configuración

## Estructura del proyecto

```
cakesphere/
├── index.html              ← Página de inicio
├── catalog.html            ← Catálogo de productos
├── product.html            ← Detalle de producto
├── cart.html               ← Carrito de compras
├── checkout.html           ← Finalizar pedido
├── order-success.html      ← Confirmación de pedido
├── contact.html            ← Contacto
├── login.html              ← Login de clientes
├── register.html           ← Registro de clientes
├── orders.html             ← Historial de pedidos (cliente)
├── admin/
│   ├── login.html          ← Login EXCLUSIVO del admin
│   ├── dashboard.html      ← Panel de estadísticas
│   ├── products.html       ← Gestión de productos
│   ├── orders.html         ← Gestión de pedidos
│   └── clients.html        ← Lista de clientes
├── css/
│   ├── main.css            ← Variables, reset, tipografía
│   ├── components.css      ← Navbar, botones, cards, modales
│   ├── pages.css           ← Estilos por página
│   └── admin.css           ← Panel admin
├── sql/
│   ├── schema.sql           ← Crea las tablas + productos de ejemplo (con fotos)
│   └── actualizar_imagenes.sql  ← Actualiza las fotos si ya habías corrido schema.sql
└── js/
    ├── supabase.js         ← ⚠️ CONFIGURAR AQUÍ tus credenciales
    ├── ui.js               ← Toast, loader, modales, utilidades
    ├── auth.js             ← Autenticación
    ├── cart.js             ← Carrito
    ├── products.js         ← Productos
    ├── orders.js           ← Pedidos
    └── admin.js            ← Panel admin
```

---

## ⚙️ Pasos para poner en funcionamiento

### 1. Crear proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta gratuita.
2. Crea un nuevo proyecto.
3. Ve a **Settings → API** y copia:
   - **Project URL** (ej: `https://abcdef.supabase.co`)
   - **anon public key** (la clave pública)

### 2. Configurar credenciales

Abre el archivo `js/supabase.js` y reemplaza:

```javascript
const SUPABASE_URL      = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI';
```

También ajusta el email del admin si lo deseas:

```javascript
const ADMIN_EMAIL = 'admin@cakesphere.com';
```

### 3. Crear las tablas en Supabase

1. En tu proyecto de Supabase, ve a **SQL Editor**.
2. Haz click en **New query**.
3. Copia y pega el contenido del archivo `sql/schema.sql` (o el SQL que está en los comentarios de `js/supabase.js`).
4. Ejecuta con **Run**.

> 💡 **¿Ya habías ejecutado `schema.sql` antes?** El script solo inserta los productos de ejemplo si la tabla está vacía, así que si ya tenías datos, pegarlo de nuevo no actualizará las fotos. En ese caso, ejecuta también `sql/actualizar_imagenes.sql` para refrescar las fotos de los 6 productos de ejemplo.

### 4. Crear el usuario administrador

1. En Supabase, ve a **Authentication → Users**.
2. Haz click en **Add user**.
3. Ingresa:
   - **Email:** `admin@cakesphere.com` (o el que configuraste en `ADMIN_EMAIL`)
   - **Password:** Una contraseña segura que solo tú conozcas
4. ✅ Guarda bien esa contraseña. **No existe registro público para el admin.**

### 5. Agregar productos de ejemplo (opcional)

En el **SQL Editor**, ejecuta el INSERT de productos de ejemplo que está en los comentarios de `js/supabase.js`.

### 6. Configurar Storage para imágenes

El SQL del schema crea automáticamente los buckets. Si prefieres hacerlo manualmente:

1. Ve a **Storage** en Supabase.
2. Crea un bucket llamado `products` (público).
3. Crea un bucket llamado `references` (público).

### 7. Abrir el sitio

- Abre `index.html` en tu navegador (doble clic o con un servidor local).
- Para el panel admin, ve a `admin/login.html`.

---

## 🎨 Personalización

### Cambiar información del negocio

Busca y reemplaza en todos los archivos HTML:

| Texto a buscar | Reemplazar por |
|---|---|
| `CakeSphere` | Nombre de tu negocio |
| `+51 999 000 000` | Tu número de teléfono |
| `hola@cakesphere.com` | Tu email |
| `Lima, Perú` | Tu ciudad |
| `admin@cakesphere.com` | Tu email de admin |

### Cambiar colores

En `css/main.css`, modifica las variables:

```css
--color-primary:     #1A0A2E;   /* Color principal (morado oscuro) */
--color-accent-gold: #C9A96E;   /* Dorado */
--color-accent-rose: #E8C4D8;   /* Rosa */
--color-bg:          #FAF7F2;   /* Fondo */
```

### Cambiar moneda

En `js/supabase.js`:

```javascript
const CURRENCY    = 'Bs';    // Cambiar a '$', '€', etc.
const DELIVERY_FEE = 5.00;  // Tarifa de envío
```

---

## 🚀 Publicar en internet (gratis)

### Opción A: Netlify (recomendado)
1. Ve a [netlify.com](https://netlify.com)
2. Arrastra la carpeta `cakesphere/` a la pantalla de Netlify
3. ¡Listo! Tendrás una URL pública en segundos.

### Opción B: GitHub Pages
1. Sube los archivos a un repositorio de GitHub
2. Ve a **Settings → Pages**
3. Selecciona la rama `main` y la carpeta raíz

### Opción C: Vercel
1. Conecta tu repositorio de GitHub a [vercel.com](https://vercel.com)
2. Deploy automático en cada push.

---

## ❓ Preguntas frecuentes

**¿Qué pasa si el stock llega a 0?**
El producto aparece automáticamente como "Agotado" y no se puede agregar al carrito.

**¿Cómo recupero la contraseña del admin?**
Desde **Supabase → Authentication → Users**, haz click en el usuario admin y usa "Send reset email".

**¿Puedo usar el sitio sin Supabase?**
El sitio funciona parcialmente sin Supabase (el carrito usa localStorage), pero los productos, pedidos y autenticación requieren Supabase.

**¿Cómo agrego WhatsApp Business?**
Reemplaza el número en todos los links `https://wa.me/51999000000` con tu número real (sin guiones ni espacios).

---

## 📞 Soporte

¿Tienes problemas con la configuración? Revisa la [documentación de Supabase](https://supabase.com/docs) o consulta en los foros de la comunidad.
