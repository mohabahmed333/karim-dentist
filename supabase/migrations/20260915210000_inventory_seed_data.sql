-- Inventory & Consumables demo/seed data — grounded in this clinic's real
-- service catalog (20260825150000_services.sql and its later additions),
-- so the module is immediately usable/demoable instead of shipping empty.
--
-- Deliberately leaves the Local Anesthesia Cartridge at qty 15 against a
-- min_stock_level of 20, so inserting its batch fires
-- enqueue_low_stock_alert() for real — a live demo of the low-stock path,
-- not just an empty settings screen. The Suture Kit gets two batches with
-- different expiries to demo the FEFO draw order across batches.
--
-- Idempotent: every insert is guarded by a NOT EXISTS on name/title so
-- re-running this migration (or applying it to a project that already has
-- hand-entered items) does not duplicate rows.
--
-- Rollback:
--   DELETE FROM public.service_recipes WHERE notes = 'seed';
--   DELETE FROM public.inventory_batches WHERE item_id IN (SELECT id FROM public.inventory_items WHERE sku LIKE 'SEED-%');
--   DELETE FROM public.inventory_items WHERE sku LIKE 'SEED-%';
--   DELETE FROM public.suppliers WHERE name IN ('MedSupply Egypt', 'Dentaline Cairo');

-- ---------------------------------------------------------------------------
-- Suppliers
-- ---------------------------------------------------------------------------
INSERT INTO public.suppliers (name, contact_name, phone, whatsapp_phone, email, notes)
SELECT 'MedSupply Egypt', 'Ahmed Farouk', '01001234567', '201001234567',
       'orders@medsupply-eg.example', 'Implants, sutures, anesthesia, bone graft — primary surgical supplier.'
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE name = 'MedSupply Egypt');

INSERT INTO public.suppliers (name, contact_name, phone, whatsapp_phone, email, notes)
SELECT 'Dentaline Cairo', 'Mona Youssef', '01123456789', '201123456789',
       'sales@dentaline-cairo.example', 'Disposables, PPE, and restorative materials.'
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE name = 'Dentaline Cairo');

-- ---------------------------------------------------------------------------
-- Items
-- ---------------------------------------------------------------------------
INSERT INTO public.inventory_items
  (name, name_ar, sku, category, unit, tracks_batches, min_stock_level, reorder_qty, default_supplier_id, last_unit_cost_egp)
SELECT 'Dental Implant Fixture', 'غرسة سنية', 'SEED-IMPL-FIX', 'implant', 'unit', true, 5, 10,
       (SELECT id FROM public.suppliers WHERE name = 'MedSupply Egypt'), 3500
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'SEED-IMPL-FIX');

INSERT INTO public.inventory_items
  (name, name_ar, sku, category, unit, tracks_batches, min_stock_level, reorder_qty, default_supplier_id, last_unit_cost_egp)
SELECT 'Implant Surgical Drill Bit (single-use)', 'حفار جراحي (استخدام واحد)', 'SEED-DRILL', 'instrument', 'unit', false, 5, 10,
       (SELECT id FROM public.suppliers WHERE name = 'MedSupply Egypt'), 150
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'SEED-DRILL');

INSERT INTO public.inventory_items
  (name, name_ar, sku, category, unit, tracks_batches, min_stock_level, reorder_qty, default_supplier_id, last_unit_cost_egp)
SELECT 'Sterile Suture Kit', 'طقم خياطة معقم', 'SEED-SUTURE', 'suture', 'unit', true, 5, 10,
       (SELECT id FROM public.suppliers WHERE name = 'MedSupply Egypt'), 45
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'SEED-SUTURE');

INSERT INTO public.inventory_items
  (name, name_ar, sku, category, unit, tracks_batches, min_stock_level, reorder_qty, default_supplier_id, last_unit_cost_egp, wastage_approval_threshold_egp)
SELECT 'Local Anesthesia Cartridge (Lidocaine 2%)', 'كارتردج تخدير موضعي', 'SEED-ANES', 'anesthesia', 'ampoule', true, 20, 50,
       (SELECT id FROM public.suppliers WHERE name = 'MedSupply Egypt'), 25, 200
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'SEED-ANES');

INSERT INTO public.inventory_items
  (name, name_ar, sku, category, unit, tracks_batches, min_stock_level, reorder_qty, default_supplier_id, last_unit_cost_egp, wastage_approval_threshold_egp)
SELECT 'Bone Graft Material', 'مادة ترقيع العظام', 'SEED-BONE', 'bone_graft', 'vial', true, 3, 6,
       (SELECT id FROM public.suppliers WHERE name = 'MedSupply Egypt'), 1200, 600
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'SEED-BONE');

INSERT INTO public.inventory_items
  (name, name_ar, sku, category, unit, tracks_batches, min_stock_level, reorder_qty, default_supplier_id, last_unit_cost_egp)
SELECT 'Endodontic Obturation Kit', 'طقم حشو العصب', 'SEED-ENDO', 'general', 'unit', true, 5, 10,
       (SELECT id FROM public.suppliers WHERE name = 'MedSupply Egypt'), 220
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'SEED-ENDO');

INSERT INTO public.inventory_items
  (name, name_ar, sku, category, unit, tracks_batches, min_stock_level, reorder_qty, default_supplier_id, last_unit_cost_egp)
SELECT 'Composite Resin Syringe', 'حقنة راتنج مركب', 'SEED-COMP', 'general', 'syringe', true, 4, 8,
       (SELECT id FROM public.suppliers WHERE name = 'Dentaline Cairo'), 180
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'SEED-COMP');

INSERT INTO public.inventory_items
  (name, name_ar, sku, category, unit, tracks_batches, min_stock_level, reorder_qty, default_supplier_id, last_unit_cost_egp)
SELECT 'Nitrile Exam Gloves (Box of 100)', 'قفازات نيتريل (علبة 100)', 'SEED-GLOVES', 'ppe', 'box', false, 10, 20,
       (SELECT id FROM public.suppliers WHERE name = 'Dentaline Cairo'), 90
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'SEED-GLOVES');

INSERT INTO public.inventory_items
  (name, name_ar, sku, category, unit, tracks_batches, min_stock_level, reorder_qty, default_supplier_id, last_unit_cost_egp)
SELECT 'Surgical Face Masks (Box of 50)', 'كمامات جراحية (علبة 50)', 'SEED-MASKS', 'ppe', 'box', false, 10, 20,
       (SELECT id FROM public.suppliers WHERE name = 'Dentaline Cairo'), 60
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'SEED-MASKS');

INSERT INTO public.inventory_items
  (name, name_ar, sku, category, unit, tracks_batches, min_stock_level, reorder_qty, default_supplier_id, last_unit_cost_egp)
SELECT 'Cotton Rolls (Box)', 'لفافات قطنية (علبة)', 'SEED-COTTON', 'disposable', 'box', false, 8, 15,
       (SELECT id FROM public.suppliers WHERE name = 'Dentaline Cairo'), 35
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'SEED-COTTON');

-- ---------------------------------------------------------------------------
-- Batches — plain inserts (not the consume_inventory_stock RPC, same as a
-- restock done through the app). This fires the low-stock trigger on the
-- anesthesia cartridge batch below, exactly as a real restock would.
-- ---------------------------------------------------------------------------
INSERT INTO public.inventory_batches (item_id, supplier_id, lot_number, expires_on, qty_received, qty_remaining, unit_cost_egp, received_at)
SELECT i.id, i.default_supplier_id, 'IMP-2026-04', '2029-06-30', 12, 12, 3500, now() - interval '20 days'
FROM public.inventory_items i WHERE i.sku = 'SEED-IMPL-FIX'
  AND NOT EXISTS (SELECT 1 FROM public.inventory_batches WHERE item_id = i.id);

INSERT INTO public.inventory_batches (item_id, supplier_id, qty_received, qty_remaining, unit_cost_egp, received_at)
SELECT i.id, i.default_supplier_id, 20, 20, 150, now() - interval '20 days'
FROM public.inventory_items i WHERE i.sku = 'SEED-DRILL'
  AND NOT EXISTS (SELECT 1 FROM public.inventory_batches WHERE item_id = i.id);

-- Two batches, different expiries: the FEFO picker draws SUT-EARLY first.
INSERT INTO public.inventory_batches (item_id, supplier_id, lot_number, expires_on, qty_received, qty_remaining, unit_cost_egp, received_at)
SELECT i.id, i.default_supplier_id, 'SUT-EARLY', current_date + interval '4 months', 10, 10, 45, now() - interval '40 days'
FROM public.inventory_items i WHERE i.sku = 'SEED-SUTURE'
  AND NOT EXISTS (SELECT 1 FROM public.inventory_batches WHERE item_id = i.id);
INSERT INTO public.inventory_batches (item_id, supplier_id, lot_number, expires_on, qty_received, qty_remaining, unit_cost_egp, received_at)
SELECT i.id, i.default_supplier_id, 'SUT-LATER', current_date + interval '14 months', 15, 15, 45, now() - interval '5 days'
FROM public.inventory_items i WHERE i.sku = 'SEED-SUTURE'
  AND (SELECT count(*) FROM public.inventory_batches WHERE item_id = i.id) < 2;

-- Deliberately below min_stock_level (20) — fires the low-stock alert on insert.
INSERT INTO public.inventory_batches (item_id, supplier_id, lot_number, expires_on, qty_received, qty_remaining, unit_cost_egp, received_at)
SELECT i.id, i.default_supplier_id, 'LID-0326', current_date + interval '8 months', 15, 15, 25, now() - interval '10 days'
FROM public.inventory_items i WHERE i.sku = 'SEED-ANES'
  AND NOT EXISTS (SELECT 1 FROM public.inventory_batches WHERE item_id = i.id);

INSERT INTO public.inventory_batches (item_id, supplier_id, lot_number, expires_on, qty_received, qty_remaining, unit_cost_egp, received_at)
SELECT i.id, i.default_supplier_id, 'BGR-119', current_date + interval '18 months', 4, 4, 1200, now() - interval '15 days'
FROM public.inventory_items i WHERE i.sku = 'SEED-BONE'
  AND NOT EXISTS (SELECT 1 FROM public.inventory_batches WHERE item_id = i.id);

INSERT INTO public.inventory_batches (item_id, supplier_id, lot_number, expires_on, qty_received, qty_remaining, unit_cost_egp, received_at)
SELECT i.id, i.default_supplier_id, 'END-0912', current_date + interval '20 months', 8, 8, 220, now() - interval '25 days'
FROM public.inventory_items i WHERE i.sku = 'SEED-ENDO'
  AND NOT EXISTS (SELECT 1 FROM public.inventory_batches WHERE item_id = i.id);

INSERT INTO public.inventory_batches (item_id, supplier_id, lot_number, expires_on, qty_received, qty_remaining, unit_cost_egp, received_at)
SELECT i.id, i.default_supplier_id, 'COMP-0715', current_date + interval '16 months', 6, 6, 180, now() - interval '12 days'
FROM public.inventory_items i WHERE i.sku = 'SEED-COMP'
  AND NOT EXISTS (SELECT 1 FROM public.inventory_batches WHERE item_id = i.id);

INSERT INTO public.inventory_batches (item_id, supplier_id, qty_received, qty_remaining, unit_cost_egp, received_at)
SELECT i.id, i.default_supplier_id, 25, 25, 90, now() - interval '7 days'
FROM public.inventory_items i WHERE i.sku = 'SEED-GLOVES'
  AND NOT EXISTS (SELECT 1 FROM public.inventory_batches WHERE item_id = i.id);

INSERT INTO public.inventory_batches (item_id, supplier_id, qty_received, qty_remaining, unit_cost_egp, received_at)
SELECT i.id, i.default_supplier_id, 30, 30, 60, now() - interval '7 days'
FROM public.inventory_items i WHERE i.sku = 'SEED-MASKS'
  AND NOT EXISTS (SELECT 1 FROM public.inventory_batches WHERE item_id = i.id);

INSERT INTO public.inventory_batches (item_id, supplier_id, qty_received, qty_remaining, unit_cost_egp, received_at)
SELECT i.id, i.default_supplier_id, 12, 12, 35, now() - interval '7 days'
FROM public.inventory_items i WHERE i.sku = 'SEED-COTTON'
  AND NOT EXISTS (SELECT 1 FROM public.inventory_batches WHERE item_id = i.id);

-- ---------------------------------------------------------------------------
-- Service recipes — links to this clinic's real published services. There is
-- no admin UI for editing recipes yet (deferred, see the module's plan doc),
-- so this migration is the only current way to wire a service to its
-- consumables; use `notes = 'seed'` to distinguish these from future
-- hand-entered rows once an editor exists.
-- ---------------------------------------------------------------------------
INSERT INTO public.service_recipes (service_id, item_id, kind, default_qty, is_required, notes)
SELECT s.id, i.id, 'fixed', 1, true, 'seed'
FROM public.services s, public.inventory_items i
WHERE s.title = 'Dental implants' AND i.sku = 'SEED-IMPL-FIX'
ON CONFLICT (service_id, item_id) DO NOTHING;

INSERT INTO public.service_recipes (service_id, item_id, kind, default_qty, is_required, notes)
SELECT s.id, i.id, 'fixed', 1, true, 'seed'
FROM public.services s, public.inventory_items i
WHERE s.title = 'Dental implants' AND i.sku = 'SEED-DRILL'
ON CONFLICT (service_id, item_id) DO NOTHING;

INSERT INTO public.service_recipes (service_id, item_id, kind, default_qty, is_required, notes)
SELECT s.id, i.id, 'fixed', 1, true, 'seed'
FROM public.services s, public.inventory_items i
WHERE s.title = 'Dental implants' AND i.sku = 'SEED-SUTURE'
ON CONFLICT (service_id, item_id) DO NOTHING;

INSERT INTO public.service_recipes (service_id, item_id, kind, default_qty, is_required, notes)
SELECT s.id, i.id, 'fixed', 1, true, 'seed'
FROM public.services s, public.inventory_items i
WHERE s.title = 'Surgical extractions and surgical treatments' AND i.sku = 'SEED-SUTURE'
ON CONFLICT (service_id, item_id) DO NOTHING;

INSERT INTO public.service_recipes (service_id, item_id, kind, default_qty, is_required, notes)
SELECT s.id, i.id, 'variable', 1, true, 'seed'
FROM public.services s, public.inventory_items i
WHERE s.title = 'Surgical extractions and surgical treatments' AND i.sku = 'SEED-ANES'
ON CONFLICT (service_id, item_id) DO NOTHING;

INSERT INTO public.service_recipes (service_id, item_id, kind, default_qty, is_required, notes)
SELECT s.id, i.id, 'fixed', 1, true, 'seed'
FROM public.services s, public.inventory_items i
WHERE s.title = 'Endodontic treatment' AND i.sku = 'SEED-ENDO'
ON CONFLICT (service_id, item_id) DO NOTHING;

INSERT INTO public.service_recipes (service_id, item_id, kind, default_qty, is_required, notes)
SELECT s.id, i.id, 'variable', 1, true, 'seed'
FROM public.services s, public.inventory_items i
WHERE s.title = 'Endodontic treatment' AND i.sku = 'SEED-ANES'
ON CONFLICT (service_id, item_id) DO NOTHING;

INSERT INTO public.service_recipes (service_id, item_id, kind, default_qty, is_required, notes)
SELECT s.id, i.id, 'variable', 0.5, true, 'seed'
FROM public.services s, public.inventory_items i
WHERE s.title = 'Periodontic treatment' AND i.sku = 'SEED-BONE'
ON CONFLICT (service_id, item_id) DO NOTHING;
