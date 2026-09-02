-- ============================================================
--  CAKESPHERE — Schema SQL completo
--  Ejecutar en: Supabase → SQL Editor → New Query
--  Pega TODO este contenido y presiona "Run"
--
--  Este script es IDEMPOTENTE: puedes pegarlo y ejecutarlo
--  varias veces sin que marque error (por ejemplo, si lo
--  corriste antes, si algo falló a la mitad, o si actualizas
--  tu proyecto). Cada política y trigger se recrea en vez de
--  duplicarse.
-- ============================================================


-- ============================================================
-- 1. TABLA: profiles (perfiles de clientes)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT NOT NULL DEFAULT '',
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seguridad por filas (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON profiles;
CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON profiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios pueden insertar su propio perfil" ON profiles;
CREATE POLICY "Usuarios pueden insertar su propio perfil"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admin puede ver todos los perfiles
DROP POLICY IF EXISTS "Admin puede ver todos los perfiles" ON profiles;
CREATE POLICY "Admin puede ver todos los perfiles"
  ON profiles FOR SELECT
  USING (auth.jwt() ->> 'email' = 'admin@cakesphere.com');


-- ============================================================
-- 2. TABLA: products (catálogo de pasteles)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT DEFAULT '',
  base_price    DECIMAL(10,2) NOT NULL DEFAULT 0,
  category      TEXT DEFAULT 'Pasteles',
  image_url     TEXT,
  images        TEXT[]   DEFAULT '{}',
  stock         INTEGER  DEFAULT 10,
  is_available  BOOLEAN  DEFAULT true,
  is_featured   BOOLEAN  DEFAULT false,
  sizes         JSONB    DEFAULT '[]',
  flavors       JSONB    DEFAULT '[]',
  coatings      JSONB    DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para productos
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede VER productos
DROP POLICY IF EXISTS "Productos visibles para todos" ON products;
CREATE POLICY "Productos visibles para todos"
  ON products FOR SELECT
  USING (true);

-- Solo admin puede CREAR productos
DROP POLICY IF EXISTS "Solo admin puede crear productos" ON products;
CREATE POLICY "Solo admin puede crear productos"
  ON products FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@cakesphere.com');

-- Solo admin puede EDITAR productos
DROP POLICY IF EXISTS "Solo admin puede editar productos" ON products;
CREATE POLICY "Solo admin puede editar productos"
  ON products FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'admin@cakesphere.com');

-- Solo admin puede ELIMINAR productos
DROP POLICY IF EXISTS "Solo admin puede eliminar productos" ON products;
CREATE POLICY "Solo admin puede eliminar productos"
  ON products FOR DELETE
  USING (auth.jwt() ->> 'email' = 'admin@cakesphere.com');


-- ============================================================
-- 3. TABLA: orders (pedidos)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number      TEXT UNIQUE NOT NULL,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name     TEXT NOT NULL,
  customer_email    TEXT,
  customer_phone    TEXT,
  delivery_address  TEXT NOT NULL,
  delivery_date     TIMESTAMPTZ,
  payment_method    TEXT DEFAULT 'efectivo',
  subtotal          DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee      DECIMAL(10,2) DEFAULT 5.00,
  total             DECIMAL(10,2) NOT NULL DEFAULT 0,
  status            TEXT DEFAULT 'pendiente'
                    CHECK (status IN ('pendiente','en_preparacion','listo','entregado','cancelado')),
  notes             TEXT DEFAULT '',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para pedidos
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Clientes solo ven SUS pedidos
DROP POLICY IF EXISTS "Clientes ven sus propios pedidos" ON orders;
CREATE POLICY "Clientes ven sus propios pedidos"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Cualquiera puede INSERTAR un pedido (incluso sin sesión)
DROP POLICY IF EXISTS "Cualquiera puede crear un pedido" ON orders;
CREATE POLICY "Cualquiera puede crear un pedido"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Admin ve TODOS los pedidos
DROP POLICY IF EXISTS "Admin ve todos los pedidos" ON orders;
CREATE POLICY "Admin ve todos los pedidos"
  ON orders FOR SELECT
  USING (auth.jwt() ->> 'email' = 'admin@cakesphere.com');

-- Admin puede ACTUALIZAR pedidos (cambiar estado)
DROP POLICY IF EXISTS "Admin puede actualizar pedidos" ON orders;
CREATE POLICY "Admin puede actualizar pedidos"
  ON orders FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'admin@cakesphere.com');

-- Admin puede ELIMINAR pedidos
DROP POLICY IF EXISTS "Admin puede eliminar pedidos" ON orders;
CREATE POLICY "Admin puede eliminar pedidos"
  ON orders FOR DELETE
  USING (auth.jwt() ->> 'email' = 'admin@cakesphere.com');


-- ============================================================
-- 4. TABLA: order_items (ítems de cada pedido)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id        UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  product_image   TEXT,
  quantity        INTEGER NOT NULL DEFAULT 1,
  unit_price      DECIMAL(10,2) NOT NULL DEFAULT 0,
  customizations  JSONB DEFAULT '{}',
  subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para ítems de pedido
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Clientes ven ítems de SUS pedidos
DROP POLICY IF EXISTS "Clientes ven items de sus pedidos" ON order_items;
CREATE POLICY "Clientes ven items de sus pedidos"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Cualquiera puede INSERTAR ítems (junto con el pedido)
DROP POLICY IF EXISTS "Cualquiera puede insertar items de pedido" ON order_items;
CREATE POLICY "Cualquiera puede insertar items de pedido"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- Admin ve TODOS los ítems
DROP POLICY IF EXISTS "Admin ve todos los items" ON order_items;
CREATE POLICY "Admin ve todos los items"
  ON order_items FOR SELECT
  USING (auth.jwt() ->> 'email' = 'admin@cakesphere.com');


-- ============================================================
-- 5. TABLA: contact_messages (mensajes del formulario de contacto)
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  subject     TEXT,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para mensajes
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ENVIAR un mensaje
DROP POLICY IF EXISTS "Cualquiera puede enviar mensaje de contacto" ON contact_messages;
CREATE POLICY "Cualquiera puede enviar mensaje de contacto"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- Solo admin puede LEER mensajes
DROP POLICY IF EXISTS "Admin lee todos los mensajes" ON contact_messages;
CREATE POLICY "Admin lee todos los mensajes"
  ON contact_messages FOR SELECT
  USING (auth.jwt() ->> 'email' = 'admin@cakesphere.com');

-- Admin puede marcar como leído
DROP POLICY IF EXISTS "Admin puede actualizar mensajes" ON contact_messages;
CREATE POLICY "Admin puede actualizar mensajes"
  ON contact_messages FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'admin@cakesphere.com');


-- ============================================================
-- 6. FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para profiles
CREATE OR REPLACE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger para products
CREATE OR REPLACE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger para orders
CREATE OR REPLACE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 7. FUNCIÓN: crear perfil automáticamente al registrarse
--    (incluye el teléfono, que auth.js sí envía en el
--    registro pero antes se perdía)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: se ejecuta cuando se crea un usuario en auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- 8. FUNCIONES: descontar stock al confirmar un pedido
--    Tu código (orders.js) llama a estas dos funciones vía
--    _supabase.rpc(...) después de crear cada pedido, pero
--    no existían todavía — por eso el stock nunca bajaba.
-- ============================================================

-- Función principal: descuenta stock y nunca lo deja negativo
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(stock - p_quantity, 0),
      is_available = CASE WHEN GREATEST(stock - p_quantity, 0) = 0 THEN false ELSE is_available END,
      updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función de respaldo (misma lógica, nombres de parámetros que usa el fallback en orders.js)
CREATE OR REPLACE FUNCTION update_stock_manual(pid UUID, qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(stock - qty, 0),
      is_available = CASE WHEN GREATEST(stock - qty, 0) = 0 THEN false ELSE is_available END,
      updated_at = NOW()
  WHERE id = pid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir que clientes (con o sin sesión) puedan ejecutar estas funciones al comprar
GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_stock_manual(UUID, INTEGER) TO anon, authenticated;


-- ============================================================
-- 9. STORAGE: Buckets para imágenes
-- ============================================================

-- Bucket para imágenes de PRODUCTOS (admin lo sube)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880,   -- 5MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para imágenes de REFERENCIA (clientes las suben)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'references',
  'references',
  true,
  5242880,   -- 5MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política storage: todos pueden VER imágenes de productos
DROP POLICY IF EXISTS "Imágenes de productos son públicas" ON storage.objects;
CREATE POLICY "Imágenes de productos son públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

-- Política storage: solo admin puede SUBIR imágenes de productos
DROP POLICY IF EXISTS "Admin puede subir imágenes de productos" ON storage.objects;
CREATE POLICY "Admin puede subir imágenes de productos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'products'
    AND auth.jwt() ->> 'email' = 'admin@cakesphere.com'
  );

-- Política storage: solo admin puede ACTUALIZAR/ELIMINAR imágenes de productos
DROP POLICY IF EXISTS "Admin puede eliminar imágenes de productos" ON storage.objects;
CREATE POLICY "Admin puede eliminar imágenes de productos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'products'
    AND auth.jwt() ->> 'email' = 'admin@cakesphere.com'
  );

-- Política storage: imágenes de referencia son públicas
DROP POLICY IF EXISTS "Imágenes de referencia son públicas" ON storage.objects;
CREATE POLICY "Imágenes de referencia son públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'references');

-- Política storage: cualquiera puede subir imagen de referencia
DROP POLICY IF EXISTS "Cualquiera puede subir imagen de referencia" ON storage.objects;
CREATE POLICY "Cualquiera puede subir imagen de referencia"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'references');


-- ============================================================
-- 10. DATOS DE EJEMPLO — Productos iniciales
--     (Puedes editarlos o eliminarlos luego desde el panel)
--     Solo se insertan si la tabla products está vacía, para
--     que no se dupliquen cada vez que vuelvas a pegar el script.
-- ============================================================
INSERT INTO products (
  name, description, base_price, category,
  stock, is_available, is_featured,
  image_url, sizes, flavors, coatings
)
SELECT * FROM (VALUES

-- Producto 1
(
  'Tarta Clásica de Chocolate',
  'Una exquisita tarta de chocolate belga con capas de bizcocho esponjoso, relleno de ganache cremoso y cobertura a tu elección. Perfecta para cumpleaños y celebraciones especiales.',
  45.00,
  'Pasteles',
  15, true, true,
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=600&fit=crop',
  '[
    {"name": "Pequeño — 6 porciones",  "price_mod": 0},
    {"name": "Mediano — 12 porciones", "price_mod": 20},
    {"name": "Grande — 20 porciones",  "price_mod": 45}
  ]'::jsonb,
  '[
    {"name": "Chocolate",   "price_mod": 0},
    {"name": "Vainilla",    "price_mod": 0},
    {"name": "Red Velvet",  "price_mod": 5},
    {"name": "Naranja",     "price_mod": 3}
  ]'::jsonb,
  '[
    {"name": "Ganache de chocolate", "price_mod": 0},
    {"name": "Buttercream clásico",  "price_mod": 5},
    {"name": "Fondant liso",         "price_mod": 10},
    {"name": "Fondant decorado",     "price_mod": 20}
  ]'::jsonb
),

-- Producto 2
(
  'Cheesecake de Fresas',
  'Cheesecake cremoso con base de galleta graham, relleno de queso crema suave y cobertura de fresas frescas de temporada. Una combinación irresistible.',
  38.00,
  'Cheesecakes',
  8, true, true,
  'https://images.unsplash.com/photo-1702923406588-1183a9ae4713?w=600&h=600&fit=crop',
  '[
    {"name": "Pequeño — 6 porciones",  "price_mod": 0},
    {"name": "Mediano — 12 porciones", "price_mod": 18},
    {"name": "Grande — 20 porciones",  "price_mod": 38}
  ]'::jsonb,
  '[
    {"name": "Queso crema clásico", "price_mod": 0},
    {"name": "Limón",               "price_mod": 0},
    {"name": "Vainilla",            "price_mod": 0},
    {"name": "Maracuyá",            "price_mod": 3}
  ]'::jsonb,
  '[
    {"name": "Fresas frescas",  "price_mod": 0},
    {"name": "Frutas mixtas",   "price_mod": 5},
    {"name": "Caramelo",        "price_mod": 3},
    {"name": "Chocolate",       "price_mod": 4}
  ]'::jsonb
),

-- Producto 3
(
  'Cupcakes Premium',
  'Set de cupcakes esponjosos elaborados con ingredientes premium y decorados artesanalmente. Perfectos para fiestas, reuniones o como regalo.',
  25.00,
  'Cupcakes',
  20, true, true,
  'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=600&h=600&fit=crop',
  '[
    {"name": "Set de 6",   "price_mod": 0},
    {"name": "Set de 12",  "price_mod": 20},
    {"name": "Set de 24",  "price_mod": 45}
  ]'::jsonb,
  '[
    {"name": "Vainilla",   "price_mod": 0},
    {"name": "Chocolate",  "price_mod": 0},
    {"name": "Limón",      "price_mod": 2},
    {"name": "Red Velvet", "price_mod": 3},
    {"name": "Oreo",       "price_mod": 4}
  ]'::jsonb,
  '[
    {"name": "Buttercream clásico",     "price_mod": 0},
    {"name": "Swiss Meringue",          "price_mod": 5},
    {"name": "Ganache de chocolate",    "price_mod": 4},
    {"name": "Crema de queso",          "price_mod": 3}
  ]'::jsonb
),

-- Producto 4
(
  'Tarta de Bodas Elegante',
  'Tarta de varios pisos diseñada especialmente para bodas y eventos formales. Elaborada con los mejores ingredientes, con decoración floral o la temática que desees.',
  120.00,
  'Especiales',
  5, true, false,
  'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&h=600&fit=crop',
  '[
    {"name": "2 pisos — 30 porciones", "price_mod": 0},
    {"name": "3 pisos — 50 porciones", "price_mod": 80},
    {"name": "4 pisos — 80 porciones", "price_mod": 180}
  ]'::jsonb,
  '[
    {"name": "Vainilla suizo",   "price_mod": 0},
    {"name": "Chocolate belga",  "price_mod": 10},
    {"name": "Red Velvet",       "price_mod": 10},
    {"name": "Champagne",        "price_mod": 15}
  ]'::jsonb,
  '[
    {"name": "Fondant liso",           "price_mod": 0},
    {"name": "Fondant con flores",     "price_mod": 30},
    {"name": "Buttercream texturizado","price_mod": 20},
    {"name": "Semi naked cake",        "price_mod": 15}
  ]'::jsonb
),

-- Producto 5
(
  'Torta de Cumpleaños Infantil',
  'Pasteles coloridos y divertidos para los pequeños de la casa. Diseños temáticos personalizables: princesas, superhéroes, dinosaurios, unicornios y más.',
  55.00,
  'Pasteles',
  12, true, false,
  'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=600&h=600&fit=crop',
  '[
    {"name": "Pequeño — 8 porciones",  "price_mod": 0},
    {"name": "Mediano — 15 porciones", "price_mod": 25},
    {"name": "Grande — 25 porciones",  "price_mod": 50}
  ]'::jsonb,
  '[
    {"name": "Vainilla",      "price_mod": 0},
    {"name": "Chocolate",     "price_mod": 0},
    {"name": "Fresa",         "price_mod": 3},
    {"name": "Arcoíris",      "price_mod": 8}
  ]'::jsonb,
  '[
    {"name": "Fondant temático",    "price_mod": 15},
    {"name": "Buttercream colorido","price_mod": 5},
    {"name": "Con figuras 3D",      "price_mod": 25}
  ]'::jsonb
),

-- Producto 6
(
  'Brownie de Chocolate',
  'Brownies artesanales ultra fudgy con trozos de chocolate amargo y nueces. Húmedos por dentro, con una corteza ligeramente crujiente. ¡Un clásico irresistible!',
  18.00,
  'Especiales',
  25, true, false,
  'https://images.unsplash.com/photo-1636743715220-d8f8dd900b87?w=600&h=600&fit=crop',
  '[
    {"name": "Bandeja de 9 unidades",  "price_mod": 0},
    {"name": "Bandeja de 16 unidades", "price_mod": 14},
    {"name": "Bandeja de 25 unidades", "price_mod": 25}
  ]'::jsonb,
  '[
    {"name": "Chocolate amargo",        "price_mod": 0},
    {"name": "Chocolate con nueces",    "price_mod": 3},
    {"name": "Nutella",                 "price_mod": 5},
    {"name": "Chocolate blanco",        "price_mod": 4}
  ]'::jsonb,
  '[
    {"name": "Sin cobertura",         "price_mod": 0},
    {"name": "Glasé de chocolate",    "price_mod": 3},
    {"name": "Con helado de vainilla","price_mod": 8}
  ]'::jsonb
)

) AS sample_products(
  name, description, base_price, category,
  stock, is_available, is_featured,
  image_url, sizes, flavors, coatings
)
WHERE NOT EXISTS (SELECT 1 FROM products);


-- ============================================================
-- 11. VERIFICACIÓN FINAL
--     Esto te muestra cuántos registros se crearon
-- ============================================================
SELECT
  'profiles'         AS tabla, COUNT(*) AS registros FROM profiles
UNION ALL SELECT
  'products',         COUNT(*) FROM products
UNION ALL SELECT
  'orders',           COUNT(*) FROM orders
UNION ALL SELECT
  'order_items',      COUNT(*) FROM order_items
UNION ALL SELECT
  'contact_messages', COUNT(*) FROM contact_messages;
