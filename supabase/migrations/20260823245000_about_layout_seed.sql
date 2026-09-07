-- About section: framed portrait + illuminated drop-cap story
UPDATE public.about
SET
  image_url = COALESCE(NULLIF(image_url, ''), '/design/about-portrait.png'),
  media_type = 'image',
  copy_image_url = NULL,
  drop_cap = 'O',
  body = E'nce upon a time, In a vibrant city of ancient wonder and modern ambition, there lived a graphic designer named Galil. With more than a decade of experience etched into his creative soul,\n\nGalil''s journey had taken him from the bustling streets of Cairo to the heart of Riyadh. His career was a mosaic of collaborations with prestigious companies and diverse clients from a variety of countries',
  updated_at = now();
