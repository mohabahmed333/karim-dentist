/**
 * Writes the "Templates to submit" section of docs/PATIENT_NOTIFICATIONS.md
 * from TEMPLATE_PROPOSALS, so the runbook and the app cannot disagree.
 *
 *   node --experimental-strip-types --import ./scripts/test-loader.mjs \
 *     scripts/write-template-proposals.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { templateProposalsMarkdown } from "../src/services/patient_notifications/templateProposals.ts";

const FILE = "docs/PATIENT_NOTIFICATIONS.md";
const OPEN = "<!-- generated:template-proposals -->";
const CLOSE = "<!-- /generated -->";

const doc = readFileSync(FILE, "utf8");
const [before, rest] = doc.split(OPEN);
if (rest === undefined) throw new Error(`${FILE} has no ${OPEN} marker`);
const after = rest.split(CLOSE)[1];
if (after === undefined) throw new Error(`${FILE} has no ${CLOSE} marker`);

writeFileSync(FILE, `${before}${OPEN}\n\n${templateProposalsMarkdown()}\n\n${CLOSE}${after}`);
console.log(`wrote the template proposals into ${FILE}`);
