#!/usr/bin/env node
/**
 * Give every service an internal billing fee, per doctor.
 *
 *   node --env-file=.env.local scripts/seed-service-prices.mjs --dry-run
 *   node --env-file=.env.local scripts/seed-service-prices.mjs
 *   node --env-file=.env.local scripts/seed-service-prices.mjs --undo
 *
 * Writes ONLY to `service_doctors`, which is internal to the admin: the bill
 * dialog reads it, and the doctor's own fee is what it charges. It deliberately
 * does not touch `services.price_label` or `price_min_egp` — those render on
 * the public website and are quoted to patients by the WhatsApp assistant, so
 * they are not a place for numbers nobody at the clinic has confirmed.
 *
 * THE FEES BELOW ARE PLACEHOLDERS. They are ordinary Egyptian private-clinic
 * ranges, not this clinic's rates. Correct them in Settings -> Prices, or edit
 * PRICES here and re-run with --undo first.
 *
 * Every row written is recorded in scripts/.seed-service-prices.json, and
 * --undo removes exactly those and nothing else.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(HERE, ".seed-service-prices.json");

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const UNDO = args.includes("--undo");

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

/** Service title (lowercased, trimmed) -> fee in EGP. Placeholders. */
const PRICES = {
  "general consultation": 400,
  "cleaning": 1200,
  "teeth whitening": 4500,
  "dental laser treatments": 3500,
  "surgical extractions and surgical treatments": 3000,
  "crowns and veneers": 9000,
  "removable prosthesis": 7000,
  "orthodontic treatment (braces)": 25000,
  "aligners": 45000,
  "pediatric dentistry": 1500,
  "periodontic treatment": 2500,
  "dental implants": 18000,
  "endodontic treatment": 6000,
  // Laser menu
  "gingivectomy": 3000,
  "gingival depigmentation": 3500,
  "oral ulcer removal": 1200,
  "frenectomy": 2500,
  "teeth whitening (laser)": 5500,
  "endodontic treatment (adults)": 6500,
  "pulpectomy in pedo (children)": 2000,
  "tmj muscle pain therapy": 1800,
  "perio pockets treatment": 2800,
  "oral surgeries": 4000,
};

/** Longest-prefix match, so a renamed or truncated title still resolves. */
function feeFor(title) {
  const needle = (title ?? "").trim().toLowerCase();
  if (!needle) return null;
  if (PRICES[needle] != null) return PRICES[needle];
  const hit = Object.keys(PRICES)
    .filter((key) => needle.startsWith(key) || key.startsWith(needle))
    .sort((a, b) => b.length - a.length)[0];
  return hit ? PRICES[hit] : null;
}

async function undo() {
  if (!existsSync(MANIFEST)) {
    console.error("No manifest at scripts/.seed-service-prices.json — nothing this script wrote is on record.");
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  console.log(`Undoing ${manifest.rows.length} fee rows from ${manifest.seededAt}`);
  for (const row of manifest.rows) {
    if (DRY) {
      console.log(`  would delete ${row.service_id} / ${row.doctor_id}`);
      continue;
    }
    const { error } = await db
      .from("service_doctors")
      .delete()
      .eq("service_id", row.service_id)
      .eq("doctor_id", row.doctor_id);
    if (error) throw error;
  }
  if (!DRY) unlinkSync(MANIFEST);
  console.log(DRY ? "Dry run — nothing deleted." : "Done.");
}

async function seed() {
  const { data: services, error: sErr } = await db
    .from("services")
    .select("id,title")
    .is("deleted_at", null)
    .order("sort_order");
  if (sErr) throw sErr;

  const { data: doctors, error: dErr } = await db
    .from("profiles")
    .select("id,display_name,roles!inner(is_doctor)")
    .eq("roles.is_doctor", true)
    .is("deleted_at", null);
  if (dErr) throw dErr;

  if (!doctors?.length) {
    console.error("No doctors found — nothing to price.");
    process.exit(1);
  }
  console.log(`Doctors: ${doctors.map((d) => d.display_name).join(", ")}`);

  // Never overwrite a fee someone has already set by hand.
  const { data: existing } = await db.from("service_doctors").select("service_id,doctor_id");
  const taken = new Set((existing ?? []).map((r) => `${r.service_id}:${r.doctor_id}`));

  const rows = [];
  const skipped = [];
  for (const service of services ?? []) {
    const fee = feeFor(service.title);
    if (fee == null) {
      skipped.push(service.title);
      continue;
    }
    for (const doctor of doctors) {
      if (taken.has(`${service.id}:${doctor.id}`)) continue;
      rows.push({
        service_id: service.id,
        doctor_id: doctor.id,
        price_egp: fee,
        price_label: `EGP ${fee}`,
      });
    }
  }

  console.log(`\nWould write ${rows.length} fee rows across ${services?.length ?? 0} services.`);
  if (skipped.length) console.log(`No fee listed for: ${skipped.join(", ")}`);

  if (DRY) {
    const byService = new Map();
    for (const row of rows) byService.set(row.service_id, row.price_egp);
    for (const service of services ?? []) {
      const fee = byService.get(service.id);
      console.log(`  ${(service.title ?? "").slice(0, 40).padEnd(42)} ${fee != null ? `EGP ${fee}` : "—"}`);
    }
    console.log("\nDry run — nothing written.");
    return;
  }

  if (rows.length === 0) {
    console.log("Nothing to write — every pair already has a fee.");
    return;
  }

  const { error } = await db.from("service_doctors").insert(rows);
  if (error) throw error;
  writeFileSync(
    MANIFEST,
    JSON.stringify({ seededAt: new Date().toISOString(), rows: rows.map(({ service_id, doctor_id }) => ({ service_id, doctor_id })) }, null, 2),
  );
  console.log(`\nWrote ${rows.length} rows. Manifest: scripts/.seed-service-prices.json`);
  console.log("Undo with:  node --env-file=.env.local scripts/seed-service-prices.mjs --undo");
}

await (UNDO ? undo() : seed());
