import type { CanvasNodeData } from "./canvas.types";
import { defaultDataForShape, getShapeDefinition } from "./shapeRegistry";

export type ShapeFormState = {
  title: string;
  date: string;
  visitType: string;
  metric: string;
  toothNumber: string;
  progressPercent: string;
  scoreBadge: string;
  drug1: string;
  drug2: string;
  drug1Timing: "day" | "night" | "both";
  drug2Timing: "day" | "night" | "both";
  perioM: string;
  perioB: string;
  perioD: string;
  perioL: string;
  schemaHeader: string;
  schemaFooterBadge: string;
  schemaTheme: "dark" | "light";
};

export function formFromShape(shapeType: string): ShapeFormState {
  const def = getShapeDefinition(shapeType);
  const data = defaultDataForShape(shapeType) ?? {};
  const bars = data.schema?.barChartData ?? [];
  return {
    title: def?.defaultTitle ?? "New Node",
    date: data.date ?? "07.10",
    visitType: data.visitType ?? "Office Visit",
    metric: data.metric ?? "62–180 bpm / Vitality Index",
    toothNumber: String(data.toothNumber ?? 14),
    progressPercent: String(data.progressPercent ?? 83),
    scoreBadge: "2.01",
    drug1: data.drugs?.[0]?.name ?? "Amoxicillin 500mg",
    drug2: data.drugs?.[1]?.name ?? "Ibuprofen 600mg",
    drug1Timing: data.drugs?.[0]?.timing ?? "day",
    drug2Timing: data.drugs?.[1]?.timing ?? "both",
    perioM: String(bars[0]?.value ?? 3),
    perioB: String(bars[1]?.value ?? 5),
    perioD: String(bars[2]?.value ?? 2),
    perioL: String(bars[3]?.value ?? 4),
    schemaHeader: data.schema?.header ?? def?.defaultTitle ?? "Custom Node",
    schemaFooterBadge: data.schema?.footerBadge ?? shapeType,
    schemaTheme: data.schema?.theme ?? "dark",
  };
}

export function formFromData(shapeType: string, nodeData?: CanvasNodeData): ShapeFormState {
  const base = formFromShape(shapeType);
  if (!nodeData) return base;

  const toothNumber =
    typeof nodeData.toothNumber === "number" ? String(nodeData.toothNumber) : base.toothNumber;

  if (shapeType === "SHAPE_02") {
    return {
      ...base,
      metric: nodeData.metric ?? base.metric,
      toothNumber,
      visitType: nodeData.visitType ?? base.visitType,
    };
  }

  if (shapeType === "SHAPE_03") {
    return {
      ...base,
      toothNumber,
      visitType: nodeData.visitType ?? base.visitType,
    };
  }

  if (shapeType === "SHAPE_05") {
    return {
      ...base,
      date: nodeData.date ?? base.date,
      visitType: nodeData.visitType ?? base.visitType,
    };
  }

  if (shapeType === "SHAPE_06") {
    const bars = nodeData.schema?.barChartData ?? [];
    const byLabel = new Map(bars.map((bar) => [bar.label, bar.value] as const));
    return {
      ...base,
      date: nodeData.date ?? base.date,
      visitType: nodeData.visitType ?? base.visitType,
      perioM: String(byLabel.get("M") ?? base.perioM),
      perioB: String(byLabel.get("B") ?? base.perioB),
      perioD: String(byLabel.get("D") ?? base.perioD),
      perioL: String(byLabel.get("L") ?? base.perioL),
    };
  }

  if (shapeType === "SHAPE_07") {
    return {
      ...base,
      progressPercent:
        typeof nodeData.progressPercent === "number"
          ? String(nodeData.progressPercent)
          : base.progressPercent,
      visitType: nodeData.visitType ?? base.visitType,
    };
  }

  if (shapeType === "SHAPE_08") {
    const drugs = nodeData.drugs ?? [];
    return {
      ...base,
      visitType: nodeData.visitType ?? base.visitType,
      drug1: drugs[0]?.name ?? base.drug1,
      drug2: drugs[1]?.name ?? base.drug2,
      drug1Timing: drugs[0]?.timing ?? base.drug1Timing,
      drug2Timing: drugs[1]?.timing ?? base.drug2Timing,
    };
  }

  if (shapeType.startsWith("SHAPE_") && Number(shapeType.replace("SHAPE_", "")) >= 9) {
    const schema = nodeData.schema;
    const bars = schema?.barChartData ?? [];
    const byLabel = new Map(bars.map((bar) => [bar.label, bar.value] as const));
    return {
      ...base,
      schemaHeader: schema?.header ?? base.schemaHeader,
      schemaFooterBadge: schema?.footerBadge ?? base.schemaFooterBadge,
      schemaTheme: schema?.theme ?? base.schemaTheme,
      // Keep schema bar chart consistent with the existing schema where possible.
      perioM: String(byLabel.get("A") ?? base.perioM),
      perioB: String(byLabel.get("B") ?? base.perioB),
    };
  }

  return base;
}

export function dataFromForm(
  shapeType: string,
  form: ShapeFormState,
  existing?: CanvasNodeData,
): CanvasNodeData {
  const tooth = Number.parseInt(form.toothNumber, 10) || 14;
  const progress = Number.parseInt(form.progressPercent, 10) || 0;
  const depth = (value: string) => Math.min(8, Math.max(1, Number.parseInt(value, 10) || 1));

  if (shapeType === "SHAPE_02") {
    return { metric: form.metric, toothNumber: tooth, visitType: form.visitType };
  }
  if (shapeType === "SHAPE_03") {
    return { toothNumber: tooth, visitType: form.visitType };
  }
  if (shapeType === "SHAPE_05") {
    return { date: form.date, visitType: form.visitType };
  }
  if (shapeType === "SHAPE_06") {
    return {
      date: form.date,
      visitType: form.visitType,
      schema: {
        header: "Pocket Depth (mm)",
        barChartData: [
          { label: "M", value: depth(form.perioM), max: 8 },
          { label: "B", value: depth(form.perioB), max: 8 },
          { label: "D", value: depth(form.perioD), max: 8 },
          { label: "L", value: depth(form.perioL), max: 8 },
        ],
      },
    };
  }
  if (shapeType === "SHAPE_07") {
    return { progressPercent: progress, visitType: form.visitType };
  }
  if (shapeType === "SHAPE_08") {
    return {
      drugs: [
        { name: form.drug1, timing: form.drug1Timing },
        { name: form.drug2, timing: form.drug2Timing },
      ],
      visitType: form.visitType,
    };
  }
  if (shapeType.startsWith("SHAPE_") && Number(shapeType.replace("SHAPE_", "")) >= 9) {
    const index = Number(shapeType.replace("SHAPE_", ""));
    const fallback = existing ?? defaultDataForShape(shapeType);
    const prevSchema = fallback?.schema;
    return {
      schema: {
        header: form.schemaHeader,
        footerBadge: form.schemaFooterBadge || shapeType,
        theme: form.schemaTheme,
        badgeColor: prevSchema?.badgeColor ?? (index % 2 === 0 ? "#E2F163" : "#FFFFFF"),
        metrics: [
          { label: "Index", value: `${60 + (index % 40)}` },
          { label: "Visit", value: form.date },
        ],
        mediaGrid: prevSchema?.mediaGrid,
        barChartData: [
          { label: "A", value: depth(form.perioM), max: 8 },
          { label: "B", value: depth(form.perioB), max: 8 },
        ],
      },
    };
  }
  return { visitType: form.visitType };
}
