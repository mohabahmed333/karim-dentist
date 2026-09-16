#!/usr/bin/env node
/**
 * Fill one patient's chart with enough volume to stress the My Day tabs.
 *
 * Seeds past visits, treatments across many teeth, and tooth notes, so the
 * Appointment History / Next Treatment / Medical Record tabs have something
 * real to scroll, paginate and sticky-position against.
 *
 *   node --env-file=.env.local scripts/seed-my-day-demo.mjs --dry-run
 *   node --env-file=.env.local scripts/seed-my-day-demo.mjs
 *   node --env-file=.env.local scripts/seed-my-day-demo.mjs --undo
 *
 * Target the patient by name (default) or phone:
 *   --name "Amr Ahmed Abdelbasir"      matched against existing reservations
 *   --phone "+201234567890"
 *
 * THIS WRITES CLINICAL-LOOKING ROWS. Every id it inserts is recorded in
 * scripts/.seed-my-day-demo.json, and `--undo` deletes exactly those ids and
 * nothing else — it never deletes a row this script did not create. Re-running
 * without --undo is a no-op while a manifest exists, so it cannot pile up.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(HERE, ".seed-my-day-demo.json");

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const value = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i === -1 ? fallback : args[i + 1];
};

const DRY = has("--dry-run");
const UNDO = has("--undo");
const NAME = value("--name", "Amr Ahmed Abdelbasir");
const PHONE = value("--phone", null);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run with --env-file=.env.local (production) or --env-file=.env.e2e (local).",
  );
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

/** Same rule as patientKeyFromNamePhone in src/services/reservations. */
function canonicalPhoneDigits(phone) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? digits : "";
}
function patientKeyFrom(name, phone) {
  const digits = canonicalPhoneDigits(phone);
  return digits ? `phone:${digits}` : `name:${name.trim().toLowerCase()}`;
}

const day = (offset, hour = 11) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, 0, 0, 0);
  return d;
};
const iso = (d) => d.toISOString();

/* ---------------------------------------------------------------- undo --- */

async function undo() {
  if (!existsSync(MANIFEST)) {
    console.error("No manifest at scripts/.seed-my-day-demo.json — nothing this script created is on record, so there is nothing safe to delete.");
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  console.log(`Undoing seed for ${manifest.patientKey} (${manifest.seededAt})`);

  for (const [table, ids] of [
    ["patient_tooth_notes", manifest.toothNotes ?? []],
    ["patient_treatments", manifest.treatments ?? []],
    ["reservations", manifest.reservations ?? []],
  ]) {
    if (!ids.length) continue;
    if (DRY) {
      console.log(`  would delete ${ids.length} × ${table}`);
      continue;
    }
    const { error } = await db.from(table).delete().in("id", ids);
    if (error) throw error;
    console.log(`  deleted ${ids.length} × ${table}`);
  }

  if (!DRY) unlinkSync(MANIFEST);
  console.log(DRY ? "Dry run — nothing deleted." : "Done. Chart is back to how it was.");
}

/* ---------------------------------------------------------------- seed --- */

/** Heavy on purpose: 16 teeth, so the timeline and odontogram both fill up. */
const TREATMENTS = [
  { fdi: "22", tooth: "Maxillary Left Lateral Incisor", label: "Tooth filling", severity: "Critical", status: "done", phase: "restorative", fee: 1800, cdt: "D2391", ago: 130 },
  { fdi: "22", tooth: "Maxillary Left Lateral Incisor", label: "Tooth filling", severity: "Critical", status: "open", phase: "urgent", fee: 2200, cdt: "D2392", ago: 12 },
  { fdi: "21", tooth: "Maxillary Left Central Incisor", label: "Composite veneer", severity: "Minor", status: "scheduled", phase: "prosthodontic", fee: 5400, cdt: "D2962", ago: 20 },
  { fdi: "18", tooth: "Maxillary Right Third Molar", label: "Extraction", severity: "Critical", status: "open", phase: "urgent", fee: 3000, cdt: "D7140", ago: 5 },
  { fdi: "16", tooth: "Maxillary Right First Molar", label: "Root canal", severity: "Critical", status: "done", phase: "urgent", fee: 6500, cdt: "D3330", ago: 210 },
  { fdi: "16", tooth: "Maxillary Right First Molar", label: "Crown", severity: "Minor", status: "done", phase: "prosthodontic", fee: 9000, cdt: "D2740", ago: 180 },
  { fdi: "26", tooth: "Maxillary Left First Molar", label: "Tooth filling", severity: "Minor", status: "done", phase: "restorative", fee: 1600, cdt: "D2391", ago: 160 },
  { fdi: "27", tooth: "Maxillary Left Second Molar", label: "Scaling", severity: "Minor", status: "open", phase: "restorative", fee: 1200, cdt: "D1110", ago: 30 },
  { fdi: "36", tooth: "Mandibular Left First Molar", label: "Root canal", severity: "Critical", status: "scheduled", phase: "urgent", fee: 6800, cdt: "D3330", ago: 8 },
  { fdi: "37", tooth: "Mandibular Left Second Molar", label: "Tooth filling", severity: "Minor", status: "done", phase: "restorative", fee: 1700, cdt: "D2392", ago: 95 },
  { fdi: "46", tooth: "Mandibular Right First Molar", label: "Crown", severity: "Minor", status: "scheduled", phase: "prosthodontic", fee: 9500, cdt: "D2740", ago: 15 },
  { fdi: "47", tooth: "Mandibular Right Second Molar", label: "Extraction", severity: "Critical", status: "open", phase: "urgent", fee: 2800, cdt: "D7140", ago: 3 },
  { fdi: "31", tooth: "Mandibular Left Central Incisor", label: "Whitening", severity: "Minor", status: "done", phase: "restorative", fee: 2500, cdt: "D9972", ago: 70 },
  { fdi: "41", tooth: "Mandibular Right Central Incisor", label: "Scaling", severity: "Minor", status: "done", phase: "restorative", fee: 1200, cdt: "D1110", ago: 70 },
  { fdi: "13", tooth: "Maxillary Right Canine", label: "Composite veneer", severity: "Minor", status: "open", phase: "prosthodontic", fee: 5200, cdt: "D2962", ago: 25 },
  { fdi: "33", tooth: "Mandibular Left Canine", label: "Tooth filling", severity: "Minor", status: "open", phase: "restorative", fee: 1500, cdt: "D2391", ago: 40 },
  { fdi: "24", tooth: "Maxillary Left First Premolar", label: "Inlay", severity: "Minor", status: "scheduled", phase: "prosthodontic", fee: 4200, cdt: "D2610", ago: 18 },
  { fdi: "44", tooth: "Mandibular Right First Premolar", label: "Tooth filling", severity: "Critical", status: "open", phase: "urgent", fee: 1900, cdt: "D2392", ago: 6 },
];

const NOTES = [
  ["22", "Advanced decay on the mesial surface. Patient reports cold sensitivity lasting past the stimulus — pulp vitality borderline, review before the next filling."],
  ["22", "Filling placed under rubber dam. Occlusion checked and adjusted; patient comfortable on leaving."],
  ["18", "Partially erupted, soft tissue inflamed around the distal. Extraction discussed and consented."],
  ["16", "Root canal completed in two visits, four canals located. Crown cemented at the follow-up; margins clean on the review radiograph."],
  ["21", "Slight incisal chip from an old trauma. Patient wants it matched to 11 before the wedding in spring."],
  ["36", "Deep occlusal caries into the pulp chamber. Emergency opening done, dressing placed — book the full root canal."],
  ["46", "Cusp fracture on the lingual, no pain. Crown planned; temporary holding well at review."],
  ["47", "Non-restorable. Extraction agreed; patient asked about an implant afterwards — referred for a CBCT."],
  ["27", "Heavy calculus on the buccal, bleeding on probing. Scaling booked; oral hygiene instruction given."],
  ["13", "Discoloured composite from a previous clinic. Replace when the veneer work on 21 is done, same shade batch."],
  ["44", "Recurrent caries under an old amalgam. Needs replacing before it reaches the pulp."],
  ["31", "Whitening tray fitted. Patient advised on the sensitivity protocol and a two-week review."],
];

const PAST_VISITS = [
  { ago: 240, label: "General consultation", status: "completed" },
  { ago: 212, label: "Root canal", status: "completed" },
  { ago: 198, label: "Root canal", status: "completed" },
  { ago: 181, label: "Crown fitting", status: "completed" },
  { ago: 162, label: "Tooth filling", status: "completed" },
  { ago: 133, label: "Tooth filling", status: "completed" },
  { ago: 120, label: "Follow-up", status: "no_show" },
  { ago: 96, label: "Tooth filling", status: "completed" },
  { ago: 71, label: "Teeth whitening", status: "completed" },
  { ago: 58, label: "Scaling and polishing", status: "cancelled" },
  { ago: 42, label: "General consultation", status: "completed" },
  { ago: 26, label: "Emergency visit", status: "completed" },
  { ago: 11, label: "Follow-up", status: "completed" },
  { ago: -7, label: "Root canal", status: "confirmed" },
  { ago: -19, label: "Crown fitting", status: "pending" },
];

async function seed() {
  if (existsSync(MANIFEST) && !DRY) {
    console.error(
      "scripts/.seed-my-day-demo.json already exists — this patient is already seeded.\n" +
        "Run with --undo first if you want a fresh set.",
    );
    process.exit(1);
  }

  // Find the patient through their existing reservations, so the seeded rows
  // land on the same patient_key My Day groups them under.
  let query = db
    .from("reservations")
    .select("id, patient_name, phone, email, doctor_id, service_id, service_label, starts_at")
    .is("deleted_at", null)
    .order("starts_at", { ascending: false })
    .limit(1);
  query = PHONE ? query.eq("phone", PHONE) : query.ilike("patient_name", `%${NAME}%`);

  const { data: found, error: findError } = await query;
  if (findError) throw findError;
  const anchor = found?.[0];
  if (!anchor) {
    console.error(`No reservation found for ${PHONE ?? NAME}. Book one first, or pass --name / --phone.`);
    process.exit(1);
  }

  const patientKey = patientKeyFrom(anchor.patient_name, anchor.phone);
  console.log(`Patient : ${anchor.patient_name} (${anchor.phone})`);
  console.log(`Key     : ${patientKey}`);

  // A real doctor id, so the tooth timeline can name the dentist.
  const { data: doctors } = await db
    .from("profiles")
    .select("id, display_name, roles!inner(is_doctor)")
    .eq("roles.is_doctor", true)
    .is("deleted_at", null)
    .limit(1);
  const doctorId = anchor.doctor_id ?? doctors?.[0]?.id ?? null;
  console.log(`Dentist : ${doctors?.[0]?.display_name ?? doctorId ?? "none found"}`);

  const visitRows = PAST_VISITS.map((v) => ({
    patient_name: anchor.patient_name,
    phone: anchor.phone,
    email: anchor.email,
    doctor_id: doctorId,
    service_id: anchor.service_id,
    service_label: v.label,
    starts_at: iso(day(-v.ago, 10 + (Math.abs(v.ago) % 7))),
    status: v.status,
    notes: "",
  }));

  const treatmentRows = TREATMENTS.map((t) => ({
    patient_key: patientKey,
    tooth_fdi: t.fdi,
    tooth_name: t.tooth,
    last_treatment: t.label,
    severity: t.severity,
    status: t.status,
    phase: t.phase,
    fee_amount: t.fee,
    cdt_code: t.cdt,
    doctor_id: doctorId,
    created_at: iso(day(-t.ago, 12)),
  }));

  const noteRows = NOTES.map(([fdi, body], i) => ({
    patient_key: patientKey,
    fdi_number: fdi,
    body,
    created_at: iso(day(-(200 - i * 15), 13)),
  }));

  console.log(
    `\nWould insert: ${visitRows.length} reservations, ${treatmentRows.length} treatments, ${noteRows.length} tooth notes.`,
  );

  if (DRY) {
    console.log("\nDry run — nothing written. Sample rows:");
    console.log(JSON.stringify({ visit: visitRows[0], treatment: treatmentRows[0], note: noteRows[0] }, null, 2));
    return;
  }

  const manifest = { patientKey, patientName: anchor.patient_name, seededAt: new Date().toISOString(), reservations: [], treatments: [], toothNotes: [] };
  // Written after every insert, so an interrupted run is still fully undoable.
  const remember = (bucket, rows) => {
    manifest[bucket].push(...rows.map((r) => r.id));
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  };

  const inserted = async (table, rows, bucket) => {
    const { data, error } = await db.from(table).insert(rows).select("id");
    if (error) throw error;
    remember(bucket, data ?? []);
    console.log(`  inserted ${data?.length ?? 0} × ${table}`);
  };

  console.log("");
  await inserted("reservations", visitRows, "reservations");
  await inserted("patient_treatments", treatmentRows, "treatments");
  await inserted("patient_tooth_notes", noteRows, "toothNotes");

  console.log(`\nDone. Manifest: scripts/.seed-my-day-demo.json`);
  console.log("Undo any time with:  node --env-file=.env.local scripts/seed-my-day-demo.mjs --undo");
}

await (UNDO ? undo() : seed());
