export * from "./types";
export * from "./schemas";
export * from "./queries";
export * from "./mutations";
export * from "./phase";
export * from "./fee";
export * from "./attachments";
export * from "./upload";
// Named, not `export *`: mutations.ts already exports an internal
// completeTreatment(supabase, ...) taken directly by this server action —
// re-exporting the action explicitly is what callers (e.g.
// usePatientTreatments.ts) should use instead.
export { completeTreatment } from "./actions";

