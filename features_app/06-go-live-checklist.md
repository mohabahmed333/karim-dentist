# 06 · Go-live checklist

Nothing reaches a patient until every step below is done. Work top to bottom.

## 1. Merge the other session's branch

`feat/whatsapp-ai-quality` has 3 commits that are not on `main`. Give
[MERGE_INSTRUCTIONS.md](MERGE_INSTRUCTIONS.md) to a Claude session and let it merge.

## 2. Check the WhatsApp Business Account ID

On 11 Sept the templates approved under `KAPSO_BUSINESS_ACCOUNT_ID` were:

```
invite_user_en · order_seryah · offer_seryah · unfulfilledorders · offer · offer · hedma · verification
```

None belong to the dental clinic. **Confirm this ID is the clinic's own account.**
If it is wrong, the dental templates will never show as approved, even after Meta
approves them.

## 3. WhatsApp templates

### Already submitted — wait for approval

`appoinment_en`, `appoinment_ar`, `reminder_en`, `reminder_ar` (see file 01 for
the name/language swap).

### Still to submit

Suggested texts. Submit each in English and Arabic.

**Cancellation** — UTILITY, 2 params
> Hi {{1}}, your appointment on {{2}} has been cancelled. Reply here to book a new time.
> أهلاً {{1}}، تم إلغاء ميعادك يوم {{2}}. ابعتلنا هنا لو حابب تحجز ميعاد جديد.

**Reschedule** — UTILITY, 3 params
> Hi {{1}}, your appointment at {{2}} has moved to {{3}}. Reply here if that doesn't suit you.
> أهلاً {{1}}، ميعادك في {{2}} اتغير لـ {{3}}. ابعتلنا لو الميعاد مش مناسب.

**Waitlist offer** — UTILITY (Meta may reclassify as marketing), 3 params
> Hi {{1}}, a spot opened at {{2}} on {{3}}. Reply "yes" within 30 minutes to take it.
> أهلاً {{1}}، في ميعاد فاضي في {{2}} يوم {{3}}. رد بـ "أيوه" خلال ٣٠ دقيقة لو عايزه.

**Follow-up** — UTILITY, 1 param
> Hi {{1}}, how are you feeling after your visit? Reply here if anything is bothering you.
> أهلاً {{1}}، عامل إيه بعد الزيارة؟ ابعتلنا لو في أي حاجة مضايقاك.

**Check-up recall** — **MARKETING**, 2 params
> Hi {{1}}, it has been 6 months since your last visit to {{2}}. Would you like to book a check-up?
> أهلاً {{1}}، عدى ٦ شهور على آخر زيارة لـ {{2}}. تحب نحجزلك ميعاد كشف؟

**Review request** — **MARKETING**, 2 params
> Thank you, {{1}}! If you have a moment, a review helps other patients find us: {{2}}
> شكراً يا {{1}}! لو عندك دقيقة، رأيك بيساعد ناس تانية تلاقينا: {{2}}

`{{2}}` in the review request can use `site_settings.contact_map_url`.

### After a template is approved

1. Add it to `PATIENT_TEMPLATES` in `src/services/patient_notifications/templates.ts`
   (exact name, which language the text is really in, number of params)
2. Add a builder in `templateParams.ts` and a `case` in `buildTemplateForKind`
3. Add a test pinning the parameter order
4. Re-check the "What's missing" panel

## 4. Production database

```bash
supabase link --project-ref puibdsyokgjdvkkousil
supabase db push --linked
```

Applies the 9 migrations. Safe: everything starts switched off, and the trigger
only writes to the new outbox table.

## 5. Vercel

- `CRON_SECRET` set in the **Production** environment
- **Redeploy** — new environment variables do not apply to an existing build
- Push `main` (triggers the production deploy)

## 6. The scheduler

In the Supabase dashboard SQL editor, once:

```sql
select vault.create_secret('https://<your-domain>/api/v1/notifications/dispatch', 'notifications_dispatch_url');
select vault.create_secret('<same value as CRON_SECRET>', 'notifications_cron_secret');
```

Then run all of `supabase/scripts/schedule_notifications_dispatch.sql`.

Check: `select * from cron.job where jobname = 'patient-notifications-dispatch';`

## 7. Turn it on, slowly

1. `/admin/settings` → Patient notifications: the panel must say **Ready to send**
2. Mode **Dry run** for about a week
3. Read `/admin/outbox`: check the rendered template and text for real bookings
4. Mode **Send**
5. For cancel-by-reply and waitlist claims, the WhatsApp assistant must also be on:
   `draft_only` → review → `auto` → only then `allow_booking_writes = true`
6. **Recalls and review requests** — only after their marketing templates are
   approved and patients have agreed to marketing messages

## Emergency stop

```sql
update patient_notification_settings set mode = 'off';   -- notifications
update whatsapp_ai_settings set mode = 'off';            -- the assistant
```

Both take effect on the next minute. No deploy needed.
