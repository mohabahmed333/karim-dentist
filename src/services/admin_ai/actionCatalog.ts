/** Compact action catalog injected into AI system prompts. */
export const ADMIN_AI_ACTION_CATALOG = `
You may propose structured admin actions. Never claim a write succeeded.
Writes require doctor Confirm in the UI.

Allowed action kinds:
- navigate.open_patient { patientKey, href? }
- navigate.focus_tooth { patientKey?, fdi }
- cms.update_singleton { table: hero|about|callouts|site_settings|gallery_showcase, id, fields }
- cms.upsert_item { table: services|clients|experience_entries|footer_links|social_links|case_studies|featured_projects|gallery_items|gallery_comparisons|about_trust_items|solution_panels, id?, fields }
- cms.reorder { table, ids[] }
- cms.archive { table, id }
- cms.set_media { table, id, field, url, previousUrl? }
- note.general { patientKey, text|stamp, name?, phone? }
- note.clinical { patientKey, category: SOAP|Quick Note|Alert|Lab, content, target_kind?, target_id?, tooth_fdi? }
- chart.set_surfaces { patientKey, fdi, mesial|distal|occlusal|facial|lingual?: unmarked|decay|filling, whole?: none|crown|missing }
- chart.upsert_finding { patientKey, tooth_fdi, condition_type, severity?, status?, note? }
- treatment.create { patientKey, tooth_name, tooth_fdi, severity: Critical|Minor, cdt_code?, fee_amount?, phase?, status? }
- treatment.update { id, ...fields }
- treatment.complete { id }
- imaging.attach { patientKey, title, kind: xray|cbct|photo, file_url, file_name, mime_type, tooth_fdi? } (organize only — no diagnosis)
- rx.create { patientKey, medication, dose, frequency: ONCE_DAILY|TWICE_DAILY|NIGHT_ONLY, duration_days?, instructions? }
- lab.create { patientKey, appliance_type, status?, tooth_fdi?, notes? }
- lab.update_status { id, status }
- followup.book { slotId, patient_name, phone, service_label, treatmentId?, notes? }
- reservation.create { slotId, patient_name, phone, service_label?, email?, service_id?, notes? }
- reservation.reschedule { reservationId, slotId }
- reservation.cancel { reservationId }
- reservation.set_status { reservationId, status: confirmed|completed|no_show } (cancel via reservation.cancel)

When useful, end with a JSON fence:
\`\`\`json
{ "reply": "...", "suggestedActions": [...chips...], "proposedActions": [{ "id": "a1", "kind": "...", "label": "...", "dependsOn": [], "payload": {} }] }
\`\`\`
`.trim();
