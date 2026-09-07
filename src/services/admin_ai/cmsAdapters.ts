import {
  CMS_COLLECTIONS,
  CMS_SINGLETONS,
  pickAllowedFields,
  type CmsCollectionTable,
  type CmsSingletonTable,
} from "./fieldAllowlist";
import type { ActionAdapter, ActionContext } from "./adapterTypes";
import type { ActionOutcome, ProposedAction } from "./schemas";

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

async function loadSingleton(
  ctx: ActionContext,
  table: CmsSingletonTable,
  id?: string,
) {
  if (id) {
    const { data, error } = await ctx.db
      .from(table)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as Record<string, unknown> | null;
  }
  const { data, error } = await ctx.db.from(table).select("*").limit(1).maybeSingle();
  if (error) throw error;
  return (data ?? null) as Record<string, unknown> | null;
}

export const cmsUpdateSingletonAdapter: ActionAdapter = {
  kind: "cms.update_singleton",
  write: true,
  async preview(action, ctx) {
    const table = String(action.payload.table) as CmsSingletonTable;
    if (!(table in CMS_SINGLETONS)) throw new Error(`Unknown table ${table}`);
    const fields = asRecord(action.payload.fields);
    const patch = pickAllowedFields(CMS_SINGLETONS[table], fields);
    if (Object.keys(patch).length === 0) {
      throw new Error("No allowed fields to update");
    }
    const current = await loadSingleton(
      ctx,
      table,
      action.payload.id ? String(action.payload.id) : undefined,
    );
    if (!current?.id) throw new Error(`${table} record not found`);
    return {
      target: `${table}:${current.id}`,
      before: pickAllowedFields(CMS_SINGLETONS[table], current),
      after: { ...pickAllowedFields(CMS_SINGLETONS[table], current), ...patch },
      snapshot: { [String(current.id)]: current },
    };
  },
  async execute(action, ctx): Promise<ActionOutcome> {
    const table = String(action.payload.table) as CmsSingletonTable;
    const id = String(action.payload.id);
    const fields = pickAllowedFields(
      CMS_SINGLETONS[table],
      asRecord(action.payload.fields),
    );
    const { data, error } = await ctx.db
      .from(table)
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: `Updated ${table}`,
      result: data as Record<string, unknown>,
    };
  },
};

export const cmsUpsertItemAdapter: ActionAdapter = {
  kind: "cms.upsert_item",
  write: true,
  async preview(action, ctx) {
    const table = String(action.payload.table) as CmsCollectionTable;
    if (!(table in CMS_COLLECTIONS)) throw new Error(`Unknown table ${table}`);
    const fields = asRecord(action.payload.fields);
    const patch = pickAllowedFields(CMS_COLLECTIONS[table], fields);
    if (Object.keys(patch).length === 0) {
      throw new Error("No allowed fields to upsert");
    }
    const id = action.payload.id ? String(action.payload.id) : null;
    let before: Record<string, unknown> = {};
    if (id) {
      const { data, error } = await ctx.db
        .from(table)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      before = (data as Record<string, unknown>) ?? {};
    }
    return {
      target: id ? `${table}:${id}` : `${table}:new`,
      before,
      after: { ...before, ...patch },
      snapshot: { [id ?? `new:${action.id}`]: before },
    };
  },
  async execute(action, ctx): Promise<ActionOutcome> {
    const table = String(action.payload.table) as CmsCollectionTable;
    const fields = pickAllowedFields(
      CMS_COLLECTIONS[table],
      asRecord(action.payload.fields),
    );
    const id = action.payload.id ? String(action.payload.id) : null;
    if (id) {
      const { data, error } = await ctx.db
        .from(table)
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return {
        actionId: action.id,
        kind: action.kind,
        ok: true,
        message: `Updated ${table}`,
        result: data as Record<string, unknown>,
      };
    }
    const { data, error } = await ctx.db
      .from(table)
      .insert(fields)
      .select("*")
      .single();
    if (error) throw error;
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: `Created ${table}`,
      result: data as Record<string, unknown>,
    };
  },
};

export function previewCmsSetMedia(action: ProposedAction) {
  const table = String(action.payload.table);
  const field = String(action.payload.field);
  const url = String(action.payload.url ?? "");
  return {
    target: `${table}.${field}`,
    before: { [field]: action.payload.previousUrl ?? null },
    after: { [field]: url || null },
    snapshot: {
      [`${table}:${action.payload.id ?? "row"}`]: {
        [field]: action.payload.previousUrl ?? null,
      },
    },
  };
}
