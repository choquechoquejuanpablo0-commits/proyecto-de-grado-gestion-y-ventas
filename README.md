# 🎂 CakeSphere — Pastelería Artesanal Online

Aplicación web para la venta de pasteles artesanales: catálogo, personalización, carrito, pedidos con varios métodos de pago y panel de administración privado. Proyecto de grado de la **Carrera Técnica en Sistemas Informáticos (2026)**.

- **Negocio:** CakeSphere
- **Ubicación:** Warnes – Satélite Norte, Santa Cruz, Bolivia
- **Teléfono / WhatsApp:** [+591 78594895](https://wa.me/59178594895)
- **Correo:** hola@cakesphere.com
- **Instagram:** [@cakeshere__ventas_de_pasteles](https://www.instagram.com/cakeshere__ventas_de_pasteles)
- **Horario de atención:** Lunes a Sábado de 9:00 a 21:00 · Domingos de 9:00 a 18:00
- **Moneda:** Bolivianos (Bs) · **Costo de envío:** Bs 5.00

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (vanilla) |
| Base de datos y autenticación | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Control de versiones | Git y GitHub |
| Despliegue | Vercel |

---

## ✨ Funcionalidades

**Clientes**
- Catálogo con categorías, disponibilidad y stock por tamaño/porción
- Detalle de producto con personalización (tamaño, sabor, cobertura, texto, etc.)
- Carrito de compras (guardado en `localStorage`)
- Checkout con resumen del pedido y 4 métodos de pago: efectivo, transferencia, Yape (QR) y tarjeta de crédito/débito
- Registro, inicio de sesión e historial de pedidos
- Formulario de contacto y enlace directo a WhatsApp

**Administrador**
- Login exclusivo del administrador
- Dashboard con estadísticas
- Gestión de productos (crear, editar, eliminar, precios, imágenes, stock y disponibilidad)
- Gestión de pedidos y cambio de estado
- Verificación de pago (simulada)
- Lista de clientes y bandeja de mensajes de contacto

> ⚠️ Los pagos con tarjeta y la verificación de transferencia son **simulados** y no realizan ningún cobro real. Están pensados para la demostración del proyecto de grado.

---

## 📁 Estructura del proyecto

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
├── QR PASTEL.png           ← Código QR de pago (Yape)
├── admin/
│   ├── login.html          ← Login EXCLUSIVO del admin
│   ├── dashboard.html      ← Panel de estadísticas
│   ├── products.html       ← Gestión de productos
│   ├── orders.html         ← Gestión de pedidos
│   ├── clients.html        ← Lista de clientes
│   └── mensajes.html       ← Mensajes del formulario de contacto
├── css/
│   ├── main.css            ← Variables, reset, tipografía
│   ├── components.css      ← Navbar, botones, cards, modales
│   ├── pages.css           ← Estilos por página
│   └── admin.css           ← Panel admin
├── sql/
│   ├── schema.sql                  ← Tablas, políticas RLS, funciones y buckets
│   ├── agregar_productos.sql       ← Agrega productos al catálogo
│   ├── actualizar_imagenes.sql     ← Actualiza las fotos de los productos
│   ├── stok_por_porcion.sql        ← Stock individual por tamaño/porción
│   └── agregar_estado_de_pago.sql  ← Columnas para el estado de pago
└── js/
    ├── supabase.js         ← ⚠️ Credenciales y constantes del negocio
    ├── ui.js               ← Toast, loader, modales, utilidades
    ├── auth.js             ← Autenticación
    ├── cart.js             ← Carrito
    ├── products.js         ← Productos
    ├── orders.js           ← Pedidos
    └── admin.js            ← Panel admin
```

---

## 🗄️ Base de datos (Supabase)

Tablas principales: `profiles`, `products`, `orders`, `order_items` y `contact_messages`.
Buckets de Storage: `products` y `references` (públicos).
Seguridad: Row Level Security (RLS) activado; solo el correo del administrador puede modificar productos y pedidos.

---

## ⚙️ Pasos para poner en funcionamiento

### 1. Crear el proyecto en Supabase
1. Entra a [https://supabase.com](https://supabase.com) y crea una cuenta gratuita.
2. Crea un nuevo proyecto.
3. Ve a **Settings → API** y copia el **Project URL** y la **anon public key**.

### 2. Configurar credenciales
Abre `js/supabase.js` y reemplaza:

```javascript
const SUPABASE_URL      = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI';
const ADMIN_EMAIL       = 'admin@cakesphere.com';
const DELIVERY_FEE      = 5.00;   // Costo de envío en Bs
const CURRENCY          = 'Bs';
```

### 3. Crear las tablas
En Supabase, ve a **SQL Editor → New query** y ejecuta los scripts de la carpeta `sql/` en este orden:

1. `schema.sql`
2. `agregar_productos.sql` (opcional, agrega productos al catálogo)
3. `stok_por_porcion.sql`
4. `agregar_estado_de_pago.sql`
5. `actualizar_imagenes.sql` (opcional, solo si quieres refrescar las fotos)

### 4. Crear el usuario administrador
1. En Supabase, ve a **Authentication → Users → Add user**.
2. Correo: `admin@cakesphere.com` (el mismo de `ADMIN_EMAIL`).
3. Define una contraseña segura. **No existe registro público para el administrador.**

### 5. Verificar Storage
El `schema.sql` crea los buckets automáticamente. Si prefieres hacerlo a mano, crea dos buckets públicos en **Storage**: `products` y `references`.

### 6. Abrir el sitio
- Abre `index.html` en el navegador (mejor con un servidor local, por ejemplo la extensión *Live Server* de VS Code).
- Panel de administración: `admin/login.html`.

---

## 🎨 Personalización

Los colores se cambian en `css/main.css`:

```css
--color-primary:     #1A0A2E;   /* Morado oscuro */
--color-accent-gold: #C9A96E;   /* Dorado */
--color-accent-rose: #E8C4D8;   /* Rosa */
--color-bg:          #FAF7F2;   /* Fondo crema */
```

---

## 🚀 Despliegue

El sitio está publicado con **Vercel**, conectado al repositorio de GitHub, por lo que cada `git push` a la rama `main` genera un nuevo despliegue automático.

Alternativas gratuitas: Netlify (arrastrando la carpeta del proyecto) o GitHub Pages (**Settings → Pages**).

---

## ❓ Preguntas frecuentes

**¿Qué pasa si el stock llega a 0?**
El producto (o el tamaño/porción) aparece como "Agotado" y no se puede agregar al carrito.

**¿Cómo recupero la contraseña del administrador?**
Desde **Supabase → Authentication → Users**, selecciona al usuario admin y usa "Send reset email".

**¿Puedo usar el sitio sin Supabase?**
Solo parcialmente: el carrito funciona con `localStorage`, pero los productos, pedidos y la autenticación requieren Supabase.

**¿Cómo cambio el número de WhatsApp?**
Reemplaza `59178594895` en los enlaces `https://wa.me/59178594895` de los archivos HTML (sin signos ni espacios).

---

## 📞 Contacto

**CakeSphere** · Warnes – Satélite Norte, Santa Cruz, Bolivia
📱 +591 78594895 · ✉️ hola@cakesphere.com · 📷 Instagram: @cakeshere__ventas_de_pasteles

© 2026 CakeSphere. Todos los derechos reservados.