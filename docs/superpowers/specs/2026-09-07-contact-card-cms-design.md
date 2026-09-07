# Contact card CMS — design

Approved: extend `site_settings` with editable clinic/doctor/credentials text plus optional card image; edit in Admin → Contact and Customize (click-to-edit).

## Fields (`site_settings`)

| Column | Type | Notes |
|--------|------|--------|
| `contact_clinic_name` | text | Left-column clinic title; fallback `brand_name` then i18n |
| `contact_clinic_name_ar` | text | Arabic |
| `contact_doctor_name` | text | Shown above card image |
| `contact_doctor_name_ar` | text | Arabic |
| `contact_credentials` | text | Multiline; each line rendered separately |
| `contact_credentials_ar` | text | Arabic |
| `contact_card_image_url` | text null | Optional upload; empty → keep current default WebP |

## Public UI

`DentalContactSection` left column:

1. Clinic name (CMS)  
2. Address, phone, blurb, Call / WhatsApp / Directions (existing)  
3. Doctor name + credential lines (new)  
4. Card image (uploaded or default asset)

`data-customize-field` on new text fields; image via Contact customize panel upload.

## Admin / Customize

- Admin → Contact: new fields + `MediaUploadField` for card image  
- Customize Contact panel: bilingual clinic/doctor/credentials + image upload  
- Auto-translate jobs include the new bilingual keys  

## Out of scope

- Redesigning the physical card layout as pure HTML (image remains optional visual)  
- Changing Call/WhatsApp/Directions link logic beyond existing settings  
