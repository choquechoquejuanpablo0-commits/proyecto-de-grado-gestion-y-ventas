-- ============================================================
--  CAKESPHERE — Stock individual por tamaño/porción
--  Ejecutar en: Supabase → SQL Editor → New Query
--
--  Qué hace este script:
--  1) Le agrega una llave "stock" a cada tamaño dentro de la
--     columna products.sizes (JSONB), usando como valor inicial
--     el stock total que ya tenía el producto (para que nada se
--     rompa mientras lo ajustas). DEBES entrar al panel admin
--     después y corregir el stock real de cada tamaño.
--  2) Crea un trigger que mantiene products.stock = suma del
--     stock de todos los tamaños automáticamente, así el catálogo,
--     las tarjetas de producto y el panel admin siguen funcionando
--     igual que antes sin tocar ese código.
--  3) Crea las funciones decrement_size_stock / increment_size_stock
--     para descontar o devolver stock de UN tamaño específico de
--     forma segura (con bloqueo de fila, para evitar condiciones
--     de carrera si dos clientes compran al mismo tiempo).
--  4) Mantiene decrement_stock / increment_stock a nivel de
--     producto completo, para productos que NO tengan tamaños.
--
--  Es IDEMPOTENTE: puedes ejecutarlo varias veces sin problema.
-- ============================================================


-- ============================================================
-- 1. Backfill: agregar "stock" a los tamaños que no lo tengan
--    (se usa el stock actual del producto como valor inicial)
-- ============================================================
UPDATE products AS p
SET sizes = sub.new_sizes
FROM (
  SELECT pr.id,
         jsonb_agg(
           CASE WHEN elem ? 'stock' THEN elem
                ELSE elem || jsonb_build_object('stock', pr.stock)
           END
         ) AS new_sizes
  FROM products pr, jsonb_array_elements(pr.sizes) AS elem
  WHERE pr.sizes IS NOT NULL AND jsonb_array_length(pr.sizes) > 0
  GROUP BY pr.id
) AS sub
WHERE p.id = sub.id;


-- ============================================================
-- 2. Trigger: products.stock = suma del stock de cada tamaño
--    (solo cuando el producto tiene tamaños definidos; si no
--    tiene, el campo stock se sigue editando manualmente como
--    antes desde el panel admin)
-- ============================================================
CREATE OR REPLACE FUNCTION sync_product_stock_from_sizes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sizes IS NOT NULL AND jsonb_array_length(NEW.sizes) > 0 THEN
    NEW.stock := (
      SELECT COALESCE(SUM((elem->>'stock')::INTEGER), 0)
      FROM jsonb_array_elements(NEW.sizes) AS elem
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_product_stock ON products;
CREATE TRIGGER trg_sync_product_stock
BEFORE INSERT OR UPDATE OF sizes ON products
FOR EACH ROW
EXECUTE FUNCTION sync_product_stock_from_sizes();

-- Forzar el cálculo una vez ahora mismo sobre los productos existentes
UPDATE products
SET sizes = sizes
WHERE sizes IS NOT NULL AND jsonb_array_length(sizes) > 0;


-- ============================================================
-- 3. Funciones para descontar / devolver stock de UN tamaño
-- ============================================================
CREATE OR REPLACE FUNCTION decrement_size_stock(
  p_product_id UUID,
  p_size_name  TEXT,
  p_quantity   INTEGER
)
RETURNS void AS $$
DECLARE
  v_sizes JSONB;
  v_idx   INTEGER;
  v_stock INTEGER;
BEGIN
  -- Bloquea la fila para que dos compras simultáneas no descuenten mal
  SELECT sizes INTO v_sizes FROM products WHERE id = p_product_id FOR UPDATE;

  IF v_sizes IS NULL OR jsonb_array_length(v_sizes) = 0 THEN
    RAISE EXCEPTION 'El producto no tiene tamaños definidos';
  END IF;

  SELECT (ordinality - 1) INTO v_idx
  FROM jsonb_array_elements(v_sizes) WITH ORDINALITY AS t(elem, ordinality)
  WHERE elem->>'name' = p_size_name
  LIMIT 1;

  IF v_idx IS NULL THEN
    RAISE EXCEPTION 'El tamaño "%" no existe en este producto', p_size_name;
  END IF;

  v_stock := COALESCE((v_sizes -> v_idx ->> 'stock')::INTEGER, 0);

  IF v_stock < p_quantity THEN
    RAISE EXCEPTION 'Stock insuficiente para el tamaño "%"', p_size_name;
  END IF;

  UPDATE products
  SET sizes = jsonb_set(sizes, ARRAY[v_idx::text, 'stock'], to_jsonb(v_stock - p_quantity)),
      updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_size_stock(
  p_product_id UUID,
  p_size_name  TEXT,
  p_quantity   INTEGER
)
RETURNS void AS $$
DECLARE
  v_sizes JSONB;
  v_idx   INTEGER;
  v_stock INTEGER;
BEGIN
  SELECT sizes INTO v_sizes FROM products WHERE id = p_product_id FOR UPDATE;

  IF v_sizes IS NULL OR jsonb_array_length(v_sizes) = 0 THEN
    RETURN; -- nada que devolver
  END IF;

  SELECT (ordinality - 1) INTO v_idx
  FROM jsonb_array_elements(v_sizes) WITH ORDINALITY AS t(elem, ordinality)
  WHERE elem->>'name' = p_size_name
  LIMIT 1;

  IF v_idx IS NULL THEN
    RETURN;
  END IF;

  v_stock := COALESCE((v_sizes -> v_idx ->> 'stock')::INTEGER, 0);

  UPDATE products
  SET sizes = jsonb_set(sizes, ARRAY[v_idx::text, 'stock'], to_jsonb(v_stock + p_quantity)),
      updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 4. Funciones a nivel de producto completo (fallback para
--    productos SIN tamaños). Si ya las tenías creadas, esto
--    simplemente las reemplaza con el mismo comportamiento.
-- ============================================================
CREATE OR REPLACE FUNCTION decrement_stock(
  p_product_id UUID,
  p_quantity   INTEGER
)
RETURNS void AS $$
DECLARE
  filas_afectadas INTEGER;
BEGIN
  UPDATE products
  SET stock = stock - p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id
    AND (sizes IS NULL OR jsonb_array_length(sizes) = 0)
    AND stock >= p_quantity;

  GET DIAGNOSTICS filas_afectadas = ROW_COUNT;
  IF filas_afectadas = 0 THEN
    RAISE EXCEPTION 'Stock insuficiente para este producto';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_stock(
  p_product_id UUID,
  p_quantity   INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock = stock + p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id
    AND (sizes IS NULL OR jsonb_array_length(sizes) = 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 5. Permisos: los clientes (con o sin sesión) deben poder
--    ejecutar estas funciones al comprar
-- ============================================================
GRANT EXECUTE ON FUNCTION decrement_size_stock(UUID, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_size_stock(UUID, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER)            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_stock(UUID, INTEGER)            TO anon, authenticated;
