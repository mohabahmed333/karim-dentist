import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { archForUniversal, fdiForUniversal, universalForFdi } from "./numbering.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { activeAlertCount, coerceSeverity, toothGlows } from "./alerts.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { assembleDentalChart, buildPatientProfile } from "./assemble.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildNodeGraph, cycleStream, filterConditionStream } from "./graph.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { clusterTimelineTicks, filterEncounters, inYearRange } from "./timeline.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { applyLabWebhook, progressForStatus } from "./labs.ts";

describe("dental chart domain", () => {
  it("maps universal 14 to FDI 26 on the maxillary arch", () => {
    assert.equal(fdiForUniversal(14), "26");
    assert.equal(universalForFdi("26"), 14);
    assert.equal(archForUniversal(14), "MAXILLARY");
    assert.equal(archForUniversal(30), "MANDIBULAR");
  });

  it("coerces active endo/abscess to CRITICAL and glowing", () => {
    assert.equal(coerceSeverity("ENDODONTIC_INFECTION", "ACTIVE", "LOW"), "CRITICAL");
    assert.equal(coerceSeverity("PERIAPICAL_ABSCESS", "ACTIVE", "MED"), "CRITICAL");
    const nodes = [
      {
        id: "a",
        toothNumber: 14,
        type: "ENDODONTIC_INFECTION" as const,
        severity: "CRITICAL" as const,
        status: "ACTIVE" as const,
        vitalityIndex: 96,
        streamVisible: true,
      },
    ];
    assert.equal(activeAlertCount(nodes), 1);
    assert.equal(toothGlows(nodes), true);
  });

  it("filters the stream by tooth and builds the endo node graph", () => {
    const chart = assembleDentalChart(buildPatientProfile("phone:1", "Layla"), []);
    const fourteen = chart.teeth.find((tooth) => tooth.toothNumber === 14);
    assert.ok(fourteen?.glowing);
    assert.equal(fourteen?.activeAlertCount, 9);
    const stream = filterConditionStream(chart.conditions, 14);
    assert.deepEqual(stream.map((n) => n.id), ["cond-endo"]);
    const graph = buildNodeGraph(chart, "cond-endo");
    assert.ok(graph);
    assert.ok(graph.anchors.includes("vitality"));
    assert.ok(graph.anchors.includes("cbct"));
    assert.equal(cycleStream(stream, "cond-endo", 1), "cond-endo");
    const all = filterConditionStream(chart.conditions, null);
    assert.equal(cycleStream(all, "cond-endo", 1), "cond-abscess");
    assert.equal(cycleStream(all, "cond-pulpitis", -1), "cond-abscess");
  });

  it("filters timeline years and clusters ticks on zoom-out", () => {
    assert.equal(inYearRange("2015-10-07T00:00:00.000Z", { startYear: 2015, endYear: 2016 }), true);
    const chart = assembleDentalChart(buildPatientProfile("phone:1", "Layla"), []);
    const slice = filterEncounters(chart.encounters, { startYear: 2015, endYear: 2016 });
    assert.ok(slice.length >= 3);
    const ticks = clusterTimelineTicks(["2015-10-07T00:00:00.000Z", "2015-10-12T00:00:00.000Z"], [2022, 2015, 2014], 1);
    assert.equal(ticks[0]?.count, 2);
  });

  it("derives lab percent from webhook status", () => {
    assert.equal(progressForStatus("FABRICATION"), 83);
    const next = applyLabWebhook(assembleDentalChart(buildPatientProfile("p", "A"), []).labs[0]!, {
      labOrderId: "lab-zirconia-14",
      status: "SHIPPED",
    });
    assert.equal(next.status, "SHIPPED");
    assert.equal(next.progressPercent, 95);
  });
});
