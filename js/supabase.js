/* ============================================================
   CAKESPHERE — supabase.js
   Configuración e instancia del cliente Supabase
   ============================================================ */

/**
 * ⚠️  INSTRUCCIONES DE CONFIGURACIÓN:
 *
 * 1. Ve a https://supabase.com y crea un proyecto gratuito.
 * 2. Ve a Settings → API y copia:
 *    - Project URL  → pégalo en SUPABASE_URL
 *    - anon public key → pégalo en SUPABASE_ANON_KEY
 *
 * 3. Ve a SQL Editor en Supabase y ejecuta el siguiente script
 *    para crear las tablas (también en /sql/schema.sql):
 *
 * ============================================================
 * SCHEMA SQL (ejecutar en Supabase SQL Editor):
 * ============================================================
 *
 * -- Tabla de perfiles de usuario
 * CREATE TABLE profiles (
 *   id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
 *   full_name TEXT NOT NULL,
 *   email TEXT,
 *   phone TEXT,
 *   address TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
 * CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
 * CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
 *
 * -- Tabla de productos
 * CREATE TABLE products (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   description TEXT,
 *   base_price DECIMAL(10,2) NOT NULL,
 *   category TEXT DEFAULT 'Pasteles',
 *   image_url TEXT,
 *   images TEXT[] DEFAULT '{}',
 *   stock INTEGER DEFAULT 10,
 *   is_available BOOLEAN DEFAULT true,
 *   is_featured BOOLEAN DEFAULT false,
 *   sizes JSONB DEFAULT '[]',
 *   flavors JSONB DEFAULT '[]',
 *   coatings JSONB DEFAULT '[]',
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * ALTER TABLE products ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
 * CREATE POLICY "Only admin can modify products" ON products FOR ALL USING (auth.jwt() ->> 'email' = 'admin@cakesphere.com');
 *
 * -- Tabla de pedidos
 * CREATE TABLE orders (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   order_number TEXT UNIQUE NOT NULL,
 *   user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 *   customer_name TEXT NOT NULL,
 *   customer_email TEXT,
 *   customer_phone TEXT,
 *   delivery_address TEXT NOT NULL,
 *   delivery_date TIMESTAMPTZ,
 *   payment_method TEXT DEFAULT 'efectivo',
 *   subtotal DECIMAL(10,2) NOT NULL,
 *   delivery_fee DECIMAL(10,2) DEFAULT 0,
 *   total DECIMAL(10,2) NOT NULL,
 *   status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente','en_preparacion','listo','entregado','cancelado')),
 *   notes TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
 * CREATE POLICY "Users can insert orders" ON orders FOR INSERT WITH CHECK (true);
 * CREATE POLICY "Admin can view all orders" ON orders FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@cakesphere.com');
 * CREATE POLICY "Admin can update orders" ON orders FOR UPDATE USING (auth.jwt() ->> 'email' = 'admin@cakesphere.com');
 *
 * -- Tabla de items del pedido
 * CREATE TABLE order_items (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
 *   product_id UUID REFERENCES products(id) ON DELETE SET NULL,
 *   product_name TEXT NOT NULL,
 *   product_image TEXT,
 *   quantity INTEGER NOT NULL DEFAULT 1,
 *   unit_price DECIMAL(10,2) NOT NULL,
 *   customizations JSONB DEFAULT '{}',
 *   subtotal DECIMAL(10,2) NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
 *   EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
 * );
 * CREATE POLICY "Allow insert order items" ON order_items FOR INSERT WITH CHECK (true);
 *
 * -- Tabla de contacto/mensajes
 * CREATE TABLE contact_messages (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   email TEXT NOT NULL,
 *   phone TEXT,
 *   subject TEXT,
 *   message TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Allow insert contact messages" ON contact_messages FOR INSERT WITH CHECK (true);
 *
 * -- Storage bucket para imágenes de productos
 * INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);
 * INSERT INTO storage.buckets (id, name, public) VALUES ('references', 'references', true);
 *
 * -- Políticas de storage
 * CREATE POLICY "Product images are public" ON storage.objects FOR SELECT USING (bucket_id = 'products');
 * CREATE POLICY "Admin can upload product images" ON storage.objects FOR INSERT
 *   WITH CHECK (bucket_id = 'products' AND auth.jwt() ->> 'email' = 'admin@cakesphere.com');
 * CREATE POLICY "Reference images are public" ON storage.objects FOR SELECT USING (bucket_id = 'references');
 * CREATE POLICY "Anyone can upload reference images" ON storage.objects FOR INSERT
 *   WITH CHECK (bucket_id = 'references');
 *
 * ============================================================
 * DATOS DE EJEMPLO (opcional):
 * ============================================================
 *
 * INSERT INTO products (name, description, base_price, category, stock, is_featured, sizes, flavors, coatings) VALUES
 * ('Tarta Clásica de Chocolate', 'Una exquisita tarta de chocolate belga con capas de ganache cremoso', 45.00, 'Pasteles', 15, true,
 *  '[{"name":"Pequeño (6 porciones)","price_mod":0},{"name":"Mediano (12 porciones)","price_mod":20},{"name":"Grande (20 porciones)","price_mod":45}]',
 *  '[{"name":"Chocolate","price_mod":0},{"name":"Vainilla","price_mod":0},{"name":"Red Velvet","price_mod":5}]',
 *  '[{"name":"Ganache de chocolate","price_mod":0},{"name":"Buttercream","price_mod":5},{"name":"Fondant liso","price_mod":10},{"name":"Fondant decorado","price_mod":20}]'),
 * ('Cheesecake de Fresas', 'Cheesecake cremoso con base de galleta y cobertura de fresas frescas', 38.00, 'Cheesecakes', 8, true,
 *  '[{"name":"Pequeño (6 porciones)","price_mod":0},{"name":"Mediano (12 porciones)","price_mod":18},{"name":"Grande (20 porciones)","price_mod":38}]',
 *  '[{"name":"Queso crema clásico","price_mod":0},{"name":"Limón","price_mod":0},{"name":"Vainilla","price_mod":0}]',
 *  '[{"name":"Fresas frescas","price_mod":0},{"name":"Frutas mixtas","price_mod":5},{"name":"Caramelo","price_mod":3}]'),
 * ('Cupcakes Premium', 'Set de cupcakes esponjosos con frosting artesanal', 25.00, 'Cupcakes', 20, true,
 *  '[{"name":"Set de 6","price_mod":0},{"name":"Set de 12","price_mod":20},{"name":"Set de 24","price_mod":45}]',
 *  '[{"name":"Vainilla","price_mod":0},{"name":"Chocolate","price_mod":0},{"name":"Limón","price_mod":2},{"name":"Red Velvet","price_mod":3}]',
 *  '[{"name":"Buttercream clásico","price_mod":0},{"name":"Swiss Meringue","price_mod":5},{"name":"Ganache","price_mod":4}]');
 *
 * ⚠️  ADMIN: Crea el usuario admin desde Supabase → Authentication → Users:
 *     Email: admin@cakesphere.com
 *     Password: [una contraseña segura que solo tú conozcas]
 */

// ============================================================
// CONFIGURACIÓN — Reemplaza con tus credenciales reales
// ============================================================
const SUPABASE_URL      = 'https://uzrdezentpfgvblfmaca.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6cmRlemVudHBmZ3ZibGZtYWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMjYxNzgsImV4cCI6MjEwMzgwMjE3OH0.yUjE-TZkLXxK7A14OSwL103E1Sw67gUb_MdSTThAqi0';

// ============================================================
// Inicializar cliente Supabase
// ============================================================
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Email del administrador (debe coincidir con el usuario creado en Supabase)
const ADMIN_EMAIL = 'admin@cakesphere.com';

// Tarifa de envío por defecto
const DELIVERY_FEE = 5.00;

// Moneda
const CURRENCY = 'Bs';
