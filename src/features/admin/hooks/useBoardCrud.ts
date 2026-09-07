"use client";

import { useState } from "react";

type WithId = { id: string; sort_order: number };

type Options<T extends WithId> = {
  initial: T[];
  create: (sortOrder: number, extra?: boolean) => Promise<T>;
  update: (id: string, payload: Record<string, unknown>) => Promise<T>;
  remove: (id: string) => Promise<void>;
};

export function useBoardCrud<T extends WithId>({
  initial,
  create,
  update,
  remove,
}: Options<T>) {
  const [items, setItems] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  async function addItem(extra?: boolean) {
    setPending(true);
    setMessage(null);
    try {
      const sort_order =
        items.reduce((max, i) => Math.max(max, i.sort_order), 0) + 1;
      const row = await create(sort_order, extra);
      setItems((prev) => [...prev, row]);
      setSelectedId(row.id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  async function onSave(payload: Record<string, unknown>) {
    if (!selected) return;
    setPending(true);
    setMessage(null);
    try {
      const row = await update(selected.id, payload);
      setItems((prev) => prev.map((i) => (i.id === row.id ? row : i)));
      setMessage("Saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!selected) return;
    setPending(true);
    try {
      await remove(selected.id);
      setItems((prev) => prev.filter((i) => i.id !== selected.id));
      setSelectedId(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  function openItem(id: string) {
    setSelectedId(id);
    setMessage(null);
  }

  return {
    items,
    selected,
    pending,
    message,
    addItem,
    onSave,
    onDelete,
    openItem,
    close: () => setSelectedId(null),
  };
}
