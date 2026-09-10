/**
 * Minimal in-memory stand-in for the Supabase client, covering only the chains
 * the action adapters actually use:
 *
 *   db.rpc(fn, args)
 *   db.from(t).select(cols).eq(c, v)[.is(c, v)].maybeSingle()
 *   db.from(t).update(values).eq(c, v)[.is(c, v)]
 *
 * It records calls so tests can assert *what was not done* — e.g. that a failed
 * booking never touched patient_treatments.
 */
export type FakeRow = Record<string, unknown>;

export type FakeDbOptions = {
  /** Seed rows per table. */
  tables?: Record<string, FakeRow[]>;
  /** Canned RPC results, keyed by function name. */
  rpc?: Record<string, { data: unknown; error: { message: string } | null }>;
  /** Force an error for a given `${table}.${op}`. */
  failOn?: Record<string, { message: string }>;
};

export type FakeDbCall =
  | { type: "rpc"; fn: string; args: FakeRow }
  | { type: "select"; table: string; filters: FakeRow }
  | { type: "update"; table: string; values: FakeRow; filters: FakeRow }
  | { type: "insert"; table: string; values: FakeRow }
  | { type: "upsert"; table: string; values: FakeRow };

export function createFakeDb(options: FakeDbOptions = {}) {
  const tables = options.tables ?? {};
  const calls: FakeDbCall[] = [];

  const matches = (row: FakeRow, filters: FakeRow) =>
    Object.entries(filters).every(([k, v]) => row[k] === v);

  function builder(
    table: string,
    op: "select" | "update" | "insert" | "upsert",
    payload: FakeRow,
  ) {
    const filters: FakeRow = {};
    const fail = options.failOn?.[`${table}.${op}`] ?? null;

    const api = {
      eq(column: string, value: unknown) {
        filters[column] = value;
        return api;
      },
      is(column: string, value: unknown) {
        filters[column] = value;
        return api;
      },
      select() {
        return api;
      },
      async maybeSingle() {
        calls.push({ type: "select", table, filters: { ...filters } });
        if (fail) return { data: null, error: fail };
        const row = (tables[table] ?? []).find((r) => matches(r, filters));
        return { data: row ?? null, error: null };
      },
      async single() {
        const out = await api.maybeSingle();
        if (!out.data && !out.error) {
          return { data: null, error: { message: "No rows found" } };
        }
        return out;
      },
      /** `await`ing an update without .select() resolves here. */
      then(resolve: (v: { data: unknown; error: unknown }) => unknown) {
        if (op === "update") {
          calls.push({
            type: "update",
            table,
            values: payload,
            filters: { ...filters },
          });
        } else if (op === "insert") {
          calls.push({ type: "insert", table, values: payload });
        } else if (op === "upsert") {
          calls.push({ type: "upsert", table, values: payload });
        }
        return Promise.resolve(
          fail ? { data: null, error: fail } : { data: null, error: null },
        ).then(resolve);
      },
    };
    return api;
  }

  return {
    calls,
    updatesTo(table: string) {
      return calls.filter(
        (c): c is Extract<FakeDbCall, { type: "update" }> =>
          c.type === "update" && c.table === table,
      );
    },
    upsertsTo(table: string) {
      return calls.filter(
        (c): c is Extract<FakeDbCall, { type: "upsert" }> =>
          c.type === "upsert" && c.table === table,
      );
    },
    insertsTo(table: string) {
      return calls.filter(
        (c): c is Extract<FakeDbCall, { type: "insert" }> =>
          c.type === "insert" && c.table === table,
      );
    },
    rpcCalls() {
      return calls.filter(
        (c): c is Extract<FakeDbCall, { type: "rpc" }> => c.type === "rpc",
      );
    },
    async rpc(fn: string, args: FakeRow) {
      calls.push({ type: "rpc", fn, args });
      return options.rpc?.[fn] ?? { data: "generated-id", error: null };
    },
    from(table: string) {
      return {
        select: () => builder(table, "select", {}),
        update: (values: FakeRow) => builder(table, "update", values),
        insert: (values: FakeRow) => builder(table, "insert", values),
        upsert: (values: FakeRow) => builder(table, "upsert", values),
      };
    },
  };
}
