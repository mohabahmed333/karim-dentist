-- Bilingual canned replies for Front desk slash commands
ALTER TABLE public.whatsapp_canned_replies
  ADD COLUMN IF NOT EXISTS title_ar text,
  ADD COLUMN IF NOT EXISTS body_ar text;

UPDATE public.whatsapp_canned_replies AS r
SET
  title_ar = v.title_ar,
  body_ar = v.body_ar,
  updated_at = now()
FROM (
  VALUES
    (
      'hello',
      'ترحيب',
      'مرحباً! شكراً لتواصلكم مع ذا دنتال لاونج. كيف يمكننا مساعدتكم اليوم؟'
    ),
    (
      'thanks',
      'شكر',
      'شكراً لتواصلكم. نقدر رسالتكم وسنرد عليكم قريباً.'
    ),
    (
      'hours',
      'ساعات العمل',
      'ساعات عمل العيادة من الأحد إلى الخميس، ١٠:٠٠–٢٠:٠٠. الجمعة بموعد مسبق فقط.'
    ),
    (
      'directions',
      'الاتجاهات',
      'نحن في A 41 مركز أوزون الطبي، القاهرة الجديدة، مباني النرجس. ردوا بـ /location لنرسل لكم موقع الخريطة.'
    ),
    (
      'booking',
      'حجز موعد',
      'يسعدنا حجز موعد لكم. يرجى مشاركة اليوم والوقت المفضلين، وسيتولى مكتب الاستقبال التأكيد.'
    ),
    (
      'wait',
      'لحظة',
      'لحظة من فضلكم — أتحقق مع الطبيب وسأرد قريباً.'
    )
) AS v(slash_key, title_ar, body_ar)
WHERE r.slash_key = v.slash_key;
