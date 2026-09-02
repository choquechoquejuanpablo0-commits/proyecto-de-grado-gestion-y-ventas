-- ============================================================
--  CAKESPHERE — Agregar 9 productos nuevos
--  Ejecutar en: Supabase → SQL Editor → New Query
--
--  Este script es IDEMPOTENTE: si vuelves a pegarlo y ejecutarlo,
--  no duplicará los productos (verifica por nombre antes de
--  insertar). Los precios ya están en Bolivianos (Bs), y las
--  fotos son imágenes reales de Unsplash.
-- ============================================================

INSERT INTO products (
  name, description, base_price, category,
  stock, is_available, is_featured,
  image_url, sizes, flavors, coatings
)
SELECT np.name, np.description, np.base_price, np.category,
       np.stock, np.is_available, np.is_featured,
       np.image_url, np.sizes, np.flavors, np.coatings
FROM (VALUES

-- Producto 7
(
  'Torta Red Velvet',
  'Suave bizcocho rojo aterciopelado con un toque de cacao, relleno y cubierto de cremoso frosting de queso crema. Un clásico elegante para cualquier celebración.',
  65.00,
  'Pasteles',
  10, true, true,
  'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=600&h=600&fit=crop',
  '[
    {"name": "Pequeño — 6 porciones",  "price_mod": 0},
    {"name": "Mediano — 12 porciones", "price_mod": 22},
    {"name": "Grande — 20 porciones",  "price_mod": 48}
  ]'::jsonb,
  '[
    {"name": "Red Velvet clásico",              "price_mod": 0},
    {"name": "Red Velvet con chispas de chocolate", "price_mod": 4}
  ]'::jsonb,
  '[
    {"name": "Frosting de queso crema", "price_mod": 0},
    {"name": "Buttercream clásico",     "price_mod": 5},
    {"name": "Fondant liso",            "price_mod": 10}
  ]'::jsonb
),

-- Producto 8
(
  'Torta Tres Leches',
  'Esponjoso bizcocho bañado en tres tipos de leche, coronado con crema chantilly y un toque de canela. Un postre húmedo y tradicional, ideal para compartir.',
  50.00,
  'Pasteles',
  12, true, false,
  'https://images.unsplash.com/photo-1566014321447-fd998cbb20a4?w=600&h=600&fit=crop',
  '[
    {"name": "Pequeño — 8 porciones",  "price_mod": 0},
    {"name": "Mediano — 15 porciones", "price_mod": 20},
    {"name": "Grande — 25 porciones",  "price_mod": 40}
  ]'::jsonb,
  '[
    {"name": "Clásica",       "price_mod": 0},
    {"name": "Con canela",    "price_mod": 2},
    {"name": "Con coco",      "price_mod": 4}
  ]'::jsonb,
  '[
    {"name": "Crema chantilly",   "price_mod": 0},
    {"name": "Merengue tostado",  "price_mod": 6},
    {"name": "Frutas frescas",    "price_mod": 8}
  ]'::jsonb
),

-- Producto 9
(
  'Torta de Zanahoria',
  'Bizcocho húmedo de zanahoria con nueces, especias cálidas y un generoso frosting de queso crema. Una opción reconfortante y menos dulce que las tortas tradicionales.',
  52.00,
  'Pasteles',
  10, true, false,
  'https://images.unsplash.com/photo-1676300186098-9b5ae9916e3c?w=600&h=600&fit=crop',
  '[
    {"name": "Pequeño — 6 porciones",  "price_mod": 0},
    {"name": "Mediano — 12 porciones", "price_mod": 20},
    {"name": "Grande — 20 porciones",  "price_mod": 45}
  ]'::jsonb,
  '[
    {"name": "Zanahoria clásica", "price_mod": 0},
    {"name": "Con nueces",        "price_mod": 3},
    {"name": "Con pasas",         "price_mod": 3}
  ]'::jsonb,
  '[
    {"name": "Frosting de queso crema", "price_mod": 0},
    {"name": "Buttercream",             "price_mod": 5},
    {"name": "Glaseado simple",         "price_mod": 3}
  ]'::jsonb
),

-- Producto 10
(
  'Cheesecake de Oreo',
  'Cheesecake cremoso con base y trozos de galleta Oreo, cubierto con ganache de chocolate. Perfecto para los amantes del chocolate y las galletas.',
  45.00,
  'Cheesecakes',
  8, true, true,
  'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=600&h=600&fit=crop',
  '[
    {"name": "Pequeño — 6 porciones",  "price_mod": 0},
    {"name": "Mediano — 12 porciones", "price_mod": 18},
    {"name": "Grande — 20 porciones",  "price_mod": 38}
  ]'::jsonb,
  '[
    {"name": "Oreo clásico",              "price_mod": 0},
    {"name": "Oreo con chocolate blanco", "price_mod": 4}
  ]'::jsonb,
  '[
    {"name": "Ganache de chocolate", "price_mod": 0},
    {"name": "Trozos de Oreo extra", "price_mod": 3},
    {"name": "Crema batida",         "price_mod": 3}
  ]'::jsonb
),

-- Producto 11
(
  'Cheesecake de Maracuyá',
  'Cheesecake suave con salsa de maracuyá fresca, un balance perfecto entre lo dulce y lo ácido. Un toque tropical para refrescar cualquier celebración.',
  42.00,
  'Cheesecakes',
  8, true, false,
  'https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=600&h=600&fit=crop',
  '[
    {"name": "Pequeño — 6 porciones",  "price_mod": 0},
    {"name": "Mediano — 12 porciones", "price_mod": 18},
    {"name": "Grande — 20 porciones",  "price_mod": 38}
  ]'::jsonb,
  '[
    {"name": "Maracuyá clásico",  "price_mod": 0},
    {"name": "Maracuyá con coco", "price_mod": 3}
  ]'::jsonb,
  '[
    {"name": "Salsa de maracuyá", "price_mod": 0},
    {"name": "Merengue",          "price_mod": 5},
    {"name": "Crema batida",      "price_mod": 3}
  ]'::jsonb
),

-- Producto 12
(
  'Cupcakes de Vainilla con Flores',
  'Cupcakes de vainilla esponjosos decorados con delicadas flores de azúcar hechas a mano. Ideales para bodas, baby showers y eventos elegantes.',
  28.00,
  'Cupcakes',
  20, true, true,
  'https://images.unsplash.com/photo-1521309918586-feb7aa79a61b?w=600&h=600&fit=crop',
  '[
    {"name": "Set de 6",  "price_mod": 0},
    {"name": "Set de 12", "price_mod": 22},
    {"name": "Set de 24", "price_mod": 48}
  ]'::jsonb,
  '[
    {"name": "Vainilla",             "price_mod": 0},
    {"name": "Vainilla con limón",   "price_mod": 2},
    {"name": "Vainilla con fresa",   "price_mod": 3}
  ]'::jsonb,
  '[
    {"name": "Buttercream con flores", "price_mod": 0},
    {"name": "Fondant con flores",     "price_mod": 8},
    {"name": "Swiss meringue",         "price_mod": 5}
  ]'::jsonb
),

-- Producto 13
(
  'Macarons Franceses',
  'Delicados macarons franceses con relleno de ganache y sabores variados. Elegantes, coloridos y perfectos para regalar o disfrutar en cualquier ocasión.',
  48.00,
  'Especiales',
  15, true, true,
  'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=600&h=600&fit=crop',
  '[
    {"name": "Caja de 6",  "price_mod": 0},
    {"name": "Caja de 12", "price_mod": 22},
    {"name": "Caja de 24", "price_mod": 45}
  ]'::jsonb,
  '[
    {"name": "Vainilla",   "price_mod": 0},
    {"name": "Chocolate",  "price_mod": 0},
    {"name": "Frambuesa",  "price_mod": 2},
    {"name": "Pistacho",   "price_mod": 4}
  ]'::jsonb,
  '[
    {"name": "Ganache de chocolate", "price_mod": 0},
    {"name": "Buttercream",          "price_mod": 2},
    {"name": "Mermelada",            "price_mod": 3}
  ]'::jsonb
),

-- Producto 14
(
  'Cinnamon Rolls',
  'Rollos de canela recién horneados, suaves por dentro y bañados en un generoso glaseado de queso crema. El aroma y sabor perfecto para el desayuno o la merienda.',
  32.00,
  'Especiales',
  18, true, false,
  'https://images.unsplash.com/photo-1694632288834-17d86b340745?w=600&h=600&fit=crop',
  '[
    {"name": "Bandeja de 4", "price_mod": 0},
    {"name": "Bandeja de 6", "price_mod": 12},
    {"name": "Bandeja de 9", "price_mod": 20}
  ]'::jsonb,
  '[
    {"name": "Canela clásico",  "price_mod": 0},
    {"name": "Con nuez",        "price_mod": 3},
    {"name": "Con chocolate",   "price_mod": 4}
  ]'::jsonb,
  '[
    {"name": "Glaseado de queso crema", "price_mod": 0},
    {"name": "Glaseado de vainilla",    "price_mod": 2},
    {"name": "Sin glaseado",            "price_mod": 0}
  ]'::jsonb
),

-- Producto 15
(
  'Tiramisú Clásico',
  'El postre italiano por excelencia: capas de bizcocho empapado en café, crema de mascarpone y un toque de cacao amargo. Cremoso, aromático e irresistible.',
  40.00,
  'Especiales',
  10, true, true,
  'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=600&fit=crop',
  '[
    {"name": "Individual",              "price_mod": 0},
    {"name": "Mediano — 8 porciones",   "price_mod": 25},
    {"name": "Grande — 15 porciones",   "price_mod": 45}
  ]'::jsonb,
  '[
    {"name": "Café clásico",        "price_mod": 0},
    {"name": "Con licor de café",   "price_mod": 5},
    {"name": "Sin cafeína",         "price_mod": 0}
  ]'::jsonb,
  '[
    {"name": "Cacao amargo",           "price_mod": 0},
    {"name": "Chocolate rallado",      "price_mod": 3},
    {"name": "Virutas de chocolate",   "price_mod": 3}
  ]'::jsonb
)

) AS np(
  name, description, base_price, category,
  stock, is_available, is_featured,
  image_url, sizes, flavors, coatings
)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = np.name
);


-- ============================================================
-- VERIFICACIÓN FINAL — muestra los productos nuevos insertados
-- ============================================================
SELECT name, category, base_price, image_url FROM products
WHERE name IN (
  'Torta Red Velvet', 'Torta Tres Leches', 'Torta de Zanahoria',
  'Cheesecake de Oreo', 'Cheesecake de Maracuyá',
  'Cupcakes de Vainilla con Flores', 'Macarons Franceses',
  'Cinnamon Rolls', 'Tiramisú Clásico'
)
ORDER BY name;
