#!/usr/bin/env node
/**
 * Everything needed to test the My Day → front desk billing flow, from nothing.
 *
 * Creates two staff logins (a doctor and a front-desk user), a test patient
 * with an appointment on the chair right now, and two completed treatments on
 * that appointment priced for that doctor — which is exactly what "Bill visit"
 * reads to seed the bill.
 *
 *   node --env-file=.env.e2e scripts/seed-billing-demo.mjs --dry-run
 *   node --env-file=.env.e2e scripts/seed-billing-demo.mjs
 *   node --env-file=.env.e2e scripts/seed-billing-demo.mjs --undo
 *
 * SAFETY. This writes staff accounts and clinical-looking rows, so:
 *  - it refuses to touch the production project unless you pass
 *    --i-know-this-is-production, because .env.local points there;
 *  - every id it creates is recorded in scripts/.seed-billing-demo.json, and
 *    `--undo` deletes exactly those ids and nothing else;
 *  - re-running without --undo is a no-op while a manifest exists.
 *
 * The passwords below are throwaway local credentials. Do not reuse them
 * anywhere that matters.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(HERE, ".seed-billing-demo.json");

/** The hosted project. Seeding staff logins into it would be a real incident. */
const PRODUCTION_REF = "puibdsyokgjdvkkousil";

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);

const DRY = has("--dry-run");
const UNDO = has("--undo");
const FORCE_PROD = has("--i-know-this-is-production");

const ACCOUNTS = [
  {
    key: "doctor",
    email: "doctor@dentallounge.local",
    password: "DentalLounge2026!",
    displayName: "Dr. Test Doctor",
    roleKey: "doctor",
    jobTitle: "Dentist",
  },
  {
    key: "front-desk",
    email: "frontdesk@dentallounge.local",
    password: "DentalLounge2026!",
    displayName: "Test Front Desk",
    roleKey: "front-desk",
    jobTitle: "Receptionist",
  },
];

const PATIENT = {
  name: "Test Patient Billing",
  phone: "+201000000001",
  email: "test.patient.billing@example.com",
};

/** Two different services, so the bill has more than one line to look at. */
const TREATMENTS = [
  { fdi: "16", tooth: "Upper right first molar", label: "Composite filling", severity: "Critical" },
  { fdi: "26", tooth: "Upper left first molar", label: "Composite filling", severity: "Minor" },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run with --env-file=.env.e2e (local). .env.local points at production.",
  );
  process.exit(1);
}

if (url.includes(PRODUCTION_REF) && !FORCE_PROD) {
  console.error(
    `\nRefusing to run: ${url} is the production project.\n\n` +
      "This creates staff logins and patient rows. Point it at your local\n" +
      "Supabase instead:\n\n" +
      "  node --env-file=.env.e2e scripts/seed-billing-demo.mjs\n\n" +
      "If you genuinely mean production, re-run with --i-know-this-is-production.\n",
  );
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

/** Same rule as patientKeyFromNamePhone in src/services/reservations. */
function canonicalPhoneDigits(phone) {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("01") && digits.length === 11) digits = `20${digits.slice(1)}`;
  return digits;
}
const patientKey = `phone:${canonicalPhoneDigits(PATIENT.phone)}`;

/** Today at a given hour, local time, as an ISO string. */
function todayAt(hour) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

async function undo() {
  if (!existsSync(MANIFEST)) {
    console.log("No manifest — nothing this script created is on record.");
    return;
  }
  const m = JSON.parse(readFileSync(MANIFEST, "utf8"));

  for (const [table, ids] of [
    ["patient_treatments", m.treatments ?? []],
    ["reservations", m.reservations ?? []],
    ["treatment_proposals", m.proposals ?? []],
  ]) {
    if (ids.length === 0) continue;
    const { error } = await db.from(table).delete().in("id", ids);
    if (error) throw error;
    console.log(`  deleted ${ids.length} × ${table}`);
  }

  for (const row of m.serviceDoctors ?? []) {
    await db
      .from("service_doctors")
      .delete()
      .eq("service_id", row.service_id)
      .eq("doctor_id", row.doctor_id);
  }
  if ((m.serviceDoctors ?? []).length) {
    console.log(`  deleted ${m.serviceDoctors.length} × service_doctors`);
  }

  // Profiles cascade from auth.users, so deleting the login is enough.
  for (const user of m.users ?? []) {
    const { error } = await db.auth.admin.deleteUser(user.id);
    if (error) console.warn(`  could not delete ${user.email}: ${error.message}`);
    else console.log(`  deleted login ${user.email}`);
  }

  unlinkSync(MANIFEST);
  console.log("\nUndone.");
}

/** Create the login if it isn't there, and give it the right role either way. */
async function ensureAccount(account, roleIdByKey, manifest, remember) {
  const roleId = roleIdByKey.get(account.roleKey);
  if (!roleId) {
    throw new Error(
      `Role '${account.roleKey}' not found. Run the migrations first: supabase db push`,
    );
  }

  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find((u) => u.email === account.email);

  let id;
  if (existing) {
    id = existing.id;
    console.log(`  reusing login ${account.email}`);
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
    });
    if (error) throw error;
    id = data.user.id;
    // Only remember logins this run created, so --undo never deletes an
    // account that was already there.
    manifest.users.push({ id, email: account.email });
    remember();
    console.log(`  created login ${account.email}`);
  }

  const { error: profileError } = await db.from("profiles").upsert(
    {
      id,
      display_name: account.displayName,
      job_title: account.jobTitle,
      role_id: roleId,
      deleted_at: null,
    },
    { onConflict: "id" },
  );
  if (profileError) throw profileError;

  return id;
}

async function seed() {
  if (existsSync(MANIFEST) && !DRY) {
    console.error(
      "A manifest already exists — this has been seeded.\n" +
        "Run with --undo first if you want a fresh set.",
    );
    process.exit(1);
  }

  const { data: roles, error: rolesError } = await db
    .from("roles")
    .select("id, key")
    .is("deleted_at", null);
  if (rolesError) throw rolesError;
  const roleIdByKey = new Map((roles ?? []).map((r) => [r.key, r.id]));

  // Two real services with a price on file, so the doctor fee has something to
  // sit on top of and the fallback rung has something to fall back to.
  const { data: services, error: servicesError } = await db
    .from("services")
    .select("id, title, price_min_egp")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .limit(2);
  if (servicesError) throw servicesError;
  if (!services || services.length < 2) {
    console.error(
      "Need at least two services in the catalogue. Add them under Settings → Services.",
    );
    process.exit(1);
  }

  console.log(`Target  : ${url}`);
  console.log(`Patient : ${PATIENT.name} (${PATIENT.phone})`);
  console.log(`Key     : ${patientKey}`);
  console.log(`Services: ${services.map((s) => s.title).join(", ")}`);

  if (DRY) {
    console.log("\nDry run — nothing written. Would create:");
    console.log(`  logins      : ${ACCOUNTS.map((a) => a.email).join(", ")}`);
    console.log(`  reservation : today 10:00, assigned to the test doctor`);
    console.log(`  treatments  : ${TREATMENTS.length}, status done, on that visit`);
    console.log(`  doctor fees : ${services.length} × service_doctors @ 750 / 1200 EGP`);
    return;
  }

  const manifest = {
    seededAt: new Date().toISOString(),
    target: url,
    patientKey,
    users: [],
    reservations: [],
    treatments: [],
    serviceDoctors: [],
    proposals: [],
  };
  // Written after every step, so an interrupted run is still fully undoable.
  const remember = () => writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  remember();

  console.log("\nAccounts");
  const doctorId = await ensureAccount(ACCOUNTS[0], roleIdByKey, manifest, remember);
  await ensureAccount(ACCOUNTS[1], roleIdByKey, manifest, remember);

  console.log("\nDoctor pricing");
  const fees = [750, 1200];
  for (const [i, service] of services.entries()) {
    const priceEgp = fees[i];
    const { error } = await db.from("service_doctors").upsert(
      {
        service_id: service.id,
        doctor_id: doctorId,
        price_egp: priceEgp,
        price_label: `EGP ${priceEgp}`,
      },
      { onConflict: "service_id,doctor_id" },
    );
    if (error) throw error;
    manifest.serviceDoctors.push({ service_id: service.id, doctor_id: doctorId });
    remember();
    console.log(`  ${service.title} → EGP ${priceEgp}`);
  }

  console.log("\nVisit");
  const { data: visit, error: visitError } = await db
    .from("reservations")
    .insert({
      patient_name: PATIENT.name,
      phone: PATIENT.phone,
      email: PATIENT.email,
      doctor_id: doctorId,
      service_id: services[0].id,
      service_label: services[0].title,
      starts_at: todayAt(10),
      status: "confirmed",
      notes: "Seeded by scripts/seed-billing-demo.mjs",
    })
    .select("id")
    .single();
  if (visitError) throw visitError;
  manifest.reservations.push(visit.id);
  remember();
  console.log(`  today 10:00 — ${services[0].title}`);

  console.log("\nCompleted work");
  const treatmentRows = TREATMENTS.map((t, i) => ({
    patient_key: patientKey,
    tooth_fdi: t.fdi,
    tooth_name: t.tooth,
    last_treatment: t.label,
    severity: t.severity,
    // done + linked to this visit is precisely what the bill seeds from.
    status: "done",
    reservation_id: visit.id,
    doctor_id: doctorId,
    service_id: services[i % services.length].id,
    fee_amount: fees[i % fees.length],
    phase: "restorative",
    ai_title: "Caries",
    ai_description: i === 0 ? "Advanced decay" : "Decay in pulp",
  }));
  const { data: treatments, error: treatmentsError } = await db
    .from("patient_treatments")
    .insert(treatmentRows)
    .select("id");
  if (treatmentsError) throw treatmentsError;
  manifest.treatments.push(...(treatments ?? []).map((r) => r.id));
  remember();
  console.log(`  ${treatments?.length ?? 0} treatments, status done`);

  console.log(`\nDone. Manifest: scripts/.seed-billing-demo.json`);
  console.log("\nSign in at http://localhost:3000/admin/login");
  for (const a of ACCOUNTS) {
    console.log(`  ${a.roleKey.padEnd(11)} ${a.email}  /  ${a.password}`);
  }
  console.log(
    "\nAs the doctor, open /admin/my-day → the test patient is in the chair →" +
      "\n  Bill visit → two lines, priced 750 and 1200." +
      "\nAs the front desk, open /admin/billing to collect it.",
  );
  console.log("\nUndo with:  node --env-file=.env.e2e scripts/seed-billing-demo.mjs --undo");
}

await (UNDO ? undo() : seed());
