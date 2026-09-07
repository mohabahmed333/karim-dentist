import {
  CMS_COLLECTIONS,
  CMS_SINGLETONS,
  type CmsCollectionTable,
  type CmsSingletonTable,
} from "./fieldAllowlist";
import type { ActionAdapter } from "./adapterTypes";
import { previewCmsSetMedia } from "./cmsAdapters";

type RowUpdate = Record<string, unknown>;

export const cmsSetMediaAdapter: ActionAdapter = {
  kind: "cms.set_media",
  write: true,
  async preview(action) {
    return previewCmsSetMedia(action);
  },
  async execute(action, ctx) {
    const table = String(action.payload.table);
    const id = String(action.payload.id);
    const field = String(action.payload.field);
    const url = action.payload.url == null ? null : String(action.payload.url);
    const singleton = CMS_SINGLETONS[table as CmsSingletonTable];
    const collection = CMS_COLLECTIONS[table as CmsCollectionTable];
    const allowed = singleton ?? collection;
    if (!allowed || !(allowed as readonly string[]).includes(field)) {
      throw new Error(`Field ${field} not allowed on ${table}`);
    }
    const patch: RowUpdate = {
      [field]: url,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await ctx.db
      .from(table as "hero")
      .update(patch as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: `Set ${table}.${field}`,
      result: data as Record<string, unknown>,
    };
  },
};

export const cmsReorderAdapter: ActionAdapter = {
  kind: "cms.reorder",
  write: true,
  async preview(action, ctx) {
    const table = String(action.payload.table) as CmsCollectionTable;
    const order = (action.payload.ids as string[]) ?? [];
    const { data, error } = await ctx.db
      .from(table as "services")
      .select("id,sort_order")
      .in("id", order);
    if (error) throw error;
    const before: Record<string, unknown> = {};
    for (const row of data ?? []) {
      before[(row as { id: string }).id] = (row as { sort_order: number })
        .sort_order;
    }
    const after: Record<string, unknown> = {};
    order.forEach((id, i) => {
      after[id] = i;
    });
    return {
      target: `${table}:order`,
      before,
      after,
      snapshot: before,
    };
  },
  async execute(action, ctx) {
    const table = String(action.payload.table);
    const order = (action.payload.ids as string[]) ?? [];
    for (let i = 0; i < order.length; i += 1) {
      const { error } = await ctx.db
        .from(table as "services")
        .update({
          sort_order: i,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", order[i]!);
      if (error) throw error;
    }
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: `Reordered ${table}`,
    };
  },
};

export const cmsArchiveAdapter: ActionAdapter = {
  kind: "cms.archive",
  write: true,
  async preview(action, ctx) {
    const table = String(action.payload.table);
    const id = String(action.payload.id);
    const { data, error } = await ctx.db
      .from(table as "services")
      .select("id,deleted_at")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    const row = data as { deleted_at?: string | null } | null;
    return {
      target: `${table}:${id}`,
      before: { deleted_at: row?.deleted_at ?? null },
      after: { deleted_at: new Date().toISOString() },
      snapshot: { [id]: (data as Record<string, unknown>) ?? {} },
    };
  },
  async execute(action, ctx) {
    const table = String(action.payload.table);
    const id = String(action.payload.id);
    const { error } = await ctx.db
      .from(table as "services")
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq("id", id);
    if (error) throw error;
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: `Archived ${table} ${id}`,
    };
  },
};
