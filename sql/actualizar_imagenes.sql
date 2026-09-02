-- ============================================================
-- CAKESPHERE — Actualizar fotos de los productos de ejemplo
-- ============================================================
-- Usa este script SOLO SI ya habías ejecutado schema.sql antes
-- (es decir, si tu tabla "products" ya tiene datos).
--
-- El script original (schema.sql) solo inserta los productos de
-- ejemplo si la tabla está vacía, así que si ya la ejecutaste una
-- vez, pegar schema.sql de nuevo NO actualiza las fotos.
-- Este script sí lo hace: actualiza el campo image_url de los
-- 6 productos de ejemplo por fotos reales verificadas.
--
-- Cómo usarlo:
-- 1. Ve a tu proyecto de Supabase → SQL Editor → New query
-- 2. Pega todo este archivo y presiona "Run"
-- ============================================================

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=600&fit=crop'
WHERE name = 'Tarta Clásica de Chocolate';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1702923406588-1183a9ae4713?w=600&h=600&fit=crop'
WHERE name = 'Cheesecake de Fresas';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=600&h=600&fit=crop'
WHERE name = 'Cupcakes Premium';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&h=600&fit=crop'
WHERE name = 'Tarta de Bodas Elegante';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=600&h=600&fit=crop'
WHERE name = 'Torta de Cumpleaños Infantil';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1636743715220-d8f8dd900b87?w=600&h=600&fit=crop'
WHERE name = 'Brownie de Chocolate';

-- Verificación: muestra los productos y su imagen actualizada
SELECT name, image_url FROM products
WHERE name IN (
  'Tarta Clásica de Chocolate', 'Cheesecake de Fresas', 'Cupcakes Premium',
  'Tarta de Bodas Elegante', 'Torta de Cumpleaños Infantil', 'Brownie de Chocolate'
);
