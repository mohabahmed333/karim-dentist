-- A second, independent reading of a receipt before it confirms a booking.
--
-- Tesseract does not detect forgery — a faked screenshot has consistent text and
-- both readers agree. What it catches is the vision model inventing a field: an
-- amount or a reference number that is not physically printed on the image,
-- which is the failure that would otherwise confirm an appointment nobody paid
-- for. So it runs only when a receipt is about to be confirmed automatically,
-- which is the only moment it can change anything.
--
-- Off by default: it costs roughly three seconds of cold start and pulls in a
-- large WASM binary, and the feature is perfectly usable without it.
--
-- Rollback:
--   ALTER TABLE public.deposit_settings DROP COLUMN IF EXISTS ocr_cross_check;

ALTER TABLE public.deposit_settings
  ADD COLUMN IF NOT EXISTS ocr_cross_check boolean NOT NULL DEFAULT false;
