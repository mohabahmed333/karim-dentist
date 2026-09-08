"use client";

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SiteSettings } from "@/services/site_settings/types";
import { upsertSettings } from "@/services/site_settings";
import { useTranslations } from "@/lib/i18n";
import {
  DEFAULT_DASHBOARD_LAYOUT,
  addDashboardWidget,
  appendToDashboardStack,
  cloneDashboardLayout,
  dropEdgeFromRatios,
  missingDashboardWidgets,
  moveToNewDashboardStack,
  normalizeDashboardLayout,
  placeDashboardWidget,
  placeInDashboardRowGap,
  removeDashboardWidget,
  resizeDashboardWidget,
  resizeDashboardWidgetHeight,
  type DashboardColSpan,
  type DashboardDropEdge,
  type DashboardLayout,
  type DashboardWidgetId,
} from "@/features/admin/lib/dashboardLayout";
import { createDragAutoScroll } from "@/features/admin/lib/dashboardDragScroll";
import {
  emptyLayoutHistory,
  layoutsEqual,
  layoutHeightsEqual,
  pushLayoutHistory,
  redoLayout,
  undoLayout,
  type LayoutHistory,
} from "@/features/admin/lib/dashboardLayoutHistory";
import {
  DASHBOARD_LAYOUT_ACTION_EVENT,
  publishDashboardLayoutState,
  type DashboardLayoutAction,
} from "@/features/admin/lib/dashboardLayoutBridge";

type DropTarget =
  | { kind: "widget"; id: DashboardWidgetId; edge: DashboardDropEdge }
  | { kind: "stack"; stackId: string }
  | { kind: "gap"; afterStackId: string; colSpan: DashboardColSpan }
  | { kind: "end" };

export function useDashboardLayoutEditor(
  initialSettings: SiteSettings | null,
  initialLayout: DashboardLayout,
) {
  const t = useTranslations();
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [editing, setEditing] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedLayout, setSavedLayout] = useState(initialLayout);
  const [draft, setDraft] = useState(initialLayout);
  const [historyEpoch, setHistoryEpoch] = useState(0);
  const historyRef = useRef<LayoutHistory>(emptyLayoutHistory());
  const heightGestureRef = useRef(false);
  const skipInitialLayoutSyncRef = useRef(false);
  const dragFromRef = useRef<DashboardWidgetId | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null);
  const autoScrollRef = useRef(createDragAutoScroll());
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const [dragFromId, setDragFromId] = useState<DashboardWidgetId | null>(null);
  const [dragOverId, setDragOverId] = useState<DashboardWidgetId | null>(null);
  const [dropEdge, setDropEdge] = useState<DashboardDropEdge | null>(null);
  const [dragOverStackId, setDragOverStackId] = useState<string | null>(null);
  const [dragOverGapId, setDragOverGapId] = useState<string | null>(null);
  const [dragOverEnd, setDragOverEnd] = useState(false);

  const dirty = !layoutsEqual(draft, savedLayout);
  const layout = editing ? draft : savedLayout;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const savedLayoutRef = useRef(savedLayout);
  savedLayoutRef.current = savedLayout;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;
  void historyEpoch;

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    // After Save/persist we already applied the upsert response. A follow-up
    // router.refresh() can briefly return a stale RSC layout and wipe heightPx
    // (and other just-saved fields) if we sync blindly.
    if (skipInitialLayoutSyncRef.current) {
      skipInitialLayoutSyncRef.current = false;
      return;
    }
    setSavedLayout(initialLayout);
    if (!editingRef.current) setDraft(initialLayout);
    historyRef.current = emptyLayoutHistory();
    setHistoryEpoch((n) => n + 1);
  }, [initialLayout]);

  useEffect(() => {
    const autoScroll = autoScrollRef.current;
    return () => autoScroll.stop();
  }, []);

  function clearHistory() {
    historyRef.current = emptyLayoutHistory();
    heightGestureRef.current = false;
    setHistoryEpoch((n) => n + 1);
  }

  function mutateDraft(
    recipe: (current: DashboardLayout) => DashboardLayout,
  ) {
    const current = draftRef.current;
    const next = recipe(current);
    if (layoutsEqual(next, current)) return;
    historyRef.current = pushLayoutHistory(historyRef.current, current);
    draftRef.current = next;
    setDraft(next);
    setHistoryEpoch((n) => n + 1);
  }

  function startEdit() {
    setDraft(cloneDashboardLayout(savedLayoutRef.current));
    draftRef.current = cloneDashboardLayout(savedLayoutRef.current);
    clearHistory();
    setEditing(true);
  }

  function cancelEdit() {
    if (
      dirtyRef.current &&
      !window.confirm(t("admin.overview.customize.discardConfirm"))
    ) {
      return;
    }
    setDraft(cloneDashboardLayout(savedLayoutRef.current));
    draftRef.current = cloneDashboardLayout(savedLayoutRef.current);
    clearHistory();
    setEditing(false);
    setCatalogOpen(false);
  }

  function toggleEdit() {
    if (editingRef.current) cancelEdit();
    else startEdit();
  }

  async function save() {
    setSaving(true);
    try {
      heightGestureRef.current = false;
      const toSave = normalizeDashboardLayout(draftRef.current);
      draftRef.current = toSave;
      setDraft(toSave);
      const row = await upsertSettings(settingsRef.current, {
        dashboard_layout: toSave,
      });
      const fromDb = normalizeDashboardLayout(row.dashboard_layout);
      // Keep client save if the echo is missing heights we just wrote.
      const next = layoutHeightsEqual(fromDb, toSave) ? fromDb : toSave;
      setSettings(row);
      setSavedLayout(next);
      savedLayoutRef.current = next;
      setDraft(next);
      draftRef.current = next;
      clearHistory();
      setEditing(false);
      setCatalogOpen(false);
      toast.success(t("admin.overview.customize.saved"));
      skipInitialLayoutSyncRef.current = true;
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("admin.overview.customize.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  function undo() {
    const current = editingRef.current
      ? draftRef.current
      : savedLayoutRef.current;
    const result = undoLayout(historyRef.current, current);
    if (!result) return;
    historyRef.current = result.history;
    draftRef.current = result.layout;
    setDraft(result.layout);
    if (!editingRef.current) {
      savedLayoutRef.current = result.layout;
      setSavedLayout(result.layout);
      void persistLayout(result.layout);
    }
    setHistoryEpoch((n) => n + 1);
  }

  function redo() {
    const current = editingRef.current
      ? draftRef.current
      : savedLayoutRef.current;
    const result = redoLayout(historyRef.current, current);
    if (!result) return;
    historyRef.current = result.history;
    draftRef.current = result.layout;
    setDraft(result.layout);
    if (!editingRef.current) {
      savedLayoutRef.current = result.layout;
      setSavedLayout(result.layout);
      void persistLayout(result.layout);
    }
    setHistoryEpoch((n) => n + 1);
  }

  async function persistLayout(next: DashboardLayout) {
    try {
      const toSave = normalizeDashboardLayout(next);
      const row = await upsertSettings(settingsRef.current, {
        dashboard_layout: toSave,
      });
      const fromDb = normalizeDashboardLayout(row.dashboard_layout);
      const normalized = layoutHeightsEqual(fromDb, toSave) ? fromDb : toSave;
      setSettings(row);
      setSavedLayout(normalized);
      savedLayoutRef.current = normalized;
      setDraft(normalized);
      draftRef.current = normalized;
      skipInitialLayoutSyncRef.current = true;
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("admin.overview.customize.saveFailed"),
      );
    }
  }

  function clearDragUi() {
    autoScrollRef.current.stop();
    dragFromRef.current = null;
    dropTargetRef.current = null;
    setDragFromId(null);
    setDragOverId(null);
    setDropEdge(null);
    setDragOverStackId(null);
    setDragOverGapId(null);
    setDragOverEnd(false);
  }

  function sameRowNeighbor(
    fromId: DashboardWidgetId,
    toId: DashboardWidgetId,
  ): boolean {
    const layout = editingRef.current
      ? draftRef.current
      : savedLayoutRef.current;
    const from = layout.find((w) => w.id === fromId);
    const to = layout.find((w) => w.id === toId);
    if (!from?.rowId || !to?.rowId || from.rowId !== to.rowId) return false;
    const fromKey = from.stackId ?? `widget:${from.id}`;
    const toKey = to.stackId ?? `widget:${to.id}`;
    return fromKey !== toKey;
  }

  function edgeForWidgetDrop(
    fromId: DashboardWidgetId,
    toId: DashboardWidgetId,
    event: DragEvent<HTMLElement>,
  ): DashboardDropEdge {
    const host = event.currentTarget.closest("[data-dash-widget-id]");
    const body =
      host?.querySelector("[data-dash-widget-body]") ?? event.currentTarget;
    const rect = body.getBoundingClientRect();
    return dropEdgeFromRatios(
      (event.clientX - rect.left) / rect.width,
      (event.clientY - rect.top) / rect.height,
      rect.height / Math.max(rect.width, 1),
      sameRowNeighbor(fromId, toId),
    );
  }

  function setWidgetTarget(id: DashboardWidgetId, edge: DashboardDropEdge) {
    dropTargetRef.current = { kind: "widget", id, edge };
    setDragOverId(id);
    setDropEdge(edge);
    setDragOverStackId(null);
    setDragOverGapId(null);
    setDragOverEnd(false);
  }

  function setStackTarget(stackId: string) {
    dropTargetRef.current = { kind: "stack", stackId };
    setDragOverStackId(stackId);
    setDragOverId(null);
    setDropEdge(null);
    setDragOverGapId(null);
    setDragOverEnd(false);
  }

  function setGapTarget(afterStackId: string, colSpan: DashboardColSpan) {
    dropTargetRef.current = { kind: "gap", afterStackId, colSpan };
    setDragOverGapId(afterStackId);
    setDragOverId(null);
    setDropEdge(null);
    setDragOverStackId(null);
    setDragOverEnd(false);
  }

  function setEndTarget() {
    dropTargetRef.current = { kind: "end" };
    setDragOverEnd(true);
    setDragOverId(null);
    setDropEdge(null);
    setDragOverStackId(null);
    setDragOverGapId(null);
  }

  function commitDrop() {
    const fromId = dragFromRef.current;
    const target = dropTargetRef.current;
    if (!fromId || !target) {
      clearDragUi();
      return;
    }
    mutateDraft((d) => {
      if (target.kind === "stack") {
        return appendToDashboardStack(d, fromId, target.stackId);
      }
      if (target.kind === "gap") {
        return placeInDashboardRowGap(
          d,
          fromId,
          target.afterStackId,
          target.colSpan,
        );
      }
      if (target.kind === "end") {
        return moveToNewDashboardStack(d, fromId, 12);
      }
      if (fromId === target.id) return d;
      const from = d.findIndex((w) => w.id === fromId);
      const to = d.findIndex((w) => w.id === target.id);
      if (from < 0 || to < 0 || from === to) return d;
      return placeDashboardWidget(d, from, to, target.edge);
    });
    clearDragUi();
  }

  function handleAction(action: DashboardLayoutAction) {
    switch (action.type) {
      case "toggleEdit":
        toggleEdit();
        break;
      case "cancelEdit":
        cancelEdit();
        break;
      case "save":
        void save();
        break;
      case "reset":
        mutateDraft(() => cloneDashboardLayout(DEFAULT_DASHBOARD_LAYOUT));
        break;
      case "undo":
        undo();
        break;
      case "redo":
        redo();
        break;
      case "toggleCatalog":
        setCatalogOpen((v) => !v);
        break;
      case "closeCatalog":
        setCatalogOpen(false);
        break;
      case "add":
        mutateDraft((d) => addDashboardWidget(d, action.id));
        setCatalogOpen(false);
        break;
    }
  }

  const handleActionRef = useRef(handleAction);
  handleActionRef.current = handleAction;

  useEffect(() => {
    publishDashboardLayoutState({
      active: true,
      editing,
      dirty,
      saving,
      catalogOpen,
      canUndo,
      canRedo,
      missing: missingDashboardWidgets(draft),
    });
  }, [
    editing,
    dirty,
    saving,
    catalogOpen,
    canUndo,
    canRedo,
    draft,
    historyEpoch,
  ]);

  useEffect(() => {
    function onAction(event: Event) {
      const detail = (event as CustomEvent<DashboardLayoutAction>).detail;
      if (detail) handleActionRef.current(detail);
    }
    window.addEventListener(DASHBOARD_LAYOUT_ACTION_EVENT, onAction);
    return () => {
      window.removeEventListener(DASHBOARD_LAYOUT_ACTION_EVENT, onAction);
      publishDashboardLayoutState({
        active: false,
        editing: false,
        dirty: false,
        saving: false,
        catalogOpen: false,
        canUndo: false,
        canRedo: false,
        missing: [],
      });
    };
  }, []);

  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  undoRef.current = undo;
  redoRef.current = redo;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        redoRef.current();
        return;
      }
      if (key === "z") {
        event.preventDefault();
        undoRef.current();
        return;
      }
      if (key === "y" && event.ctrlKey) {
        event.preventDefault();
        redoRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return {
    editing,
    catalogOpen,
    saving,
    dirty,
    layout,
    draft,
    canUndo,
    canRedo,
    dragOverId,
    dropEdge,
    dragFromId,
    dragOverStackId,
    dragOverGapId,
    dragOverEnd,
    missing: missingDashboardWidgets(draft),
    startEdit,
    cancelEdit,
    save,
    undo,
    redo,
    reset: () =>
      mutateDraft(() => cloneDashboardLayout(DEFAULT_DASHBOARD_LAYOUT)),
    toggleCatalog: () => setCatalogOpen((v) => !v),
    closeCatalog: () => setCatalogOpen(false),
    add: (id: DashboardWidgetId) =>
      mutateDraft((d) => addDashboardWidget(d, id)),
    resize: (id: DashboardWidgetId, colSpan: DashboardColSpan) =>
      mutateDraft((d) => resizeDashboardWidget(d, id, colSpan)),
    resizeHeight: (id: DashboardWidgetId, heightPx: number) => {
      if (!editingRef.current) {
        const current = savedLayoutRef.current;
        if (!heightGestureRef.current) {
          historyRef.current = pushLayoutHistory(historyRef.current, current);
          heightGestureRef.current = true;
          setHistoryEpoch((n) => n + 1);
        }
        const next = resizeDashboardWidgetHeight(current, id, heightPx);
        savedLayoutRef.current = next;
        draftRef.current = next;
        setSavedLayout(next);
        setDraft(next);
        return;
      }
      if (!heightGestureRef.current) {
        heightGestureRef.current = true;
        mutateDraft((d) => resizeDashboardWidgetHeight(d, id, heightPx));
        return;
      }
      const next = resizeDashboardWidgetHeight(draftRef.current, id, heightPx);
      draftRef.current = next;
      setDraft(next);
    },
    commitHeight: () => {
      heightGestureRef.current = false;
      if (editingRef.current) return;
      void persistLayout(savedLayoutRef.current);
    },
    remove: (id: DashboardWidgetId) =>
      mutateDraft((d) => removeDashboardWidget(d, id)),
    onDragStart: (
      id: DashboardWidgetId,
      event: DragEvent<HTMLElement>,
    ) => {
      const target = event.target as Element;
      if (target.closest("[data-no-widget-drag]")) {
        event.preventDefault();
        return;
      }
      dragFromRef.current = id;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", id);
      // Prefer the real card for the ghost — drag surfaces are empty overlays.
      const ghost =
        event.currentTarget
          .closest("[data-dash-widget-id]")
          ?.querySelector("[data-dash-widget-body]") ??
        event.currentTarget.closest("[data-dash-widget-id]") ??
        event.currentTarget;
      event.dataTransfer.setDragImage(ghost as Element, 24, 24);
      setDragFromId(id);
      dropTargetRef.current = null;
      setDragOverId(null);
      setDropEdge(null);
      setDragOverStackId(null);
      setDragOverGapId(null);
      setDragOverEnd(false);
      autoScrollRef.current.notePointer(event.clientY);
      autoScrollRef.current.start(event.currentTarget);
    },
    onDragOver: (
      id: DashboardWidgetId,
      event: DragEvent<HTMLElement>,
    ) => {
      const fromId = dragFromRef.current;
      if (!fromId || fromId === id) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      autoScrollRef.current.notePointer(event.clientY);
      setWidgetTarget(id, edgeForWidgetDrop(fromId, id, event));
    },
    onDrop: (
      id: DashboardWidgetId,
      event: DragEvent<HTMLElement>,
    ) => {
      event.preventDefault();
      event.stopPropagation();
      const fromId =
        dragFromRef.current ??
        (event.dataTransfer.getData("text/plain") as DashboardWidgetId);
      if (!fromId || fromId === id) {
        clearDragUi();
        return;
      }
      dragFromRef.current = fromId;
      setWidgetTarget(id, edgeForWidgetDrop(fromId, id, event));
      commitDrop();
    },
    onStackDragOver: (stackId: string, event: DragEvent<HTMLElement>) => {
      if (!dragFromRef.current) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      autoScrollRef.current.notePointer(event.clientY);
      setStackTarget(stackId);
    },
    onStackDrop: (stackId: string, event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const fromId =
        dragFromRef.current ??
        (event.dataTransfer.getData("text/plain") as DashboardWidgetId);
      if (!fromId) {
        clearDragUi();
        return;
      }
      dragFromRef.current = fromId;
      setStackTarget(stackId);
      commitDrop();
    },
    onGapDragOver: (
      afterStackId: string,
      colSpan: DashboardColSpan,
      event: DragEvent<HTMLElement>,
    ) => {
      if (!dragFromRef.current) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      autoScrollRef.current.notePointer(event.clientY);
      setGapTarget(afterStackId, colSpan);
    },
    onGapDrop: (
      afterStackId: string,
      colSpan: DashboardColSpan,
      event: DragEvent<HTMLElement>,
    ) => {
      event.preventDefault();
      event.stopPropagation();
      const fromId =
        dragFromRef.current ??
        (event.dataTransfer.getData("text/plain") as DashboardWidgetId);
      if (!fromId) {
        clearDragUi();
        return;
      }
      dragFromRef.current = fromId;
      setGapTarget(afterStackId, colSpan);
      commitDrop();
    },
    onEndDragOver: (event: DragEvent<HTMLElement>) => {
      if (!dragFromRef.current) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      autoScrollRef.current.notePointer(event.clientY);
      setEndTarget();
    },
    onEndDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const fromId =
        dragFromRef.current ??
        (event.dataTransfer.getData("text/plain") as DashboardWidgetId);
      if (!fromId) {
        clearDragUi();
        return;
      }
      dragFromRef.current = fromId;
      setEndTarget();
      commitDrop();
    },
    onDragEnd: commitDrop,
  };
}
