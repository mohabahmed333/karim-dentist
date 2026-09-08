import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildStaticCommandHits,
  filterCommandHits,
  groupCommandHits,
  hitsFromPatients,
  hitsFromReservations,
  pushRecentId,
  recentHits,
  type CommandHit,
} from "./commandPalette.ts";

const hit = (partial: Partial<CommandHit> & Pick<CommandHit, "id" | "title">): CommandHit => ({
  kind: "page",
  href: "/admin",
  keywords: "",
  ...partial,
});

describe("filterCommandHits", () => {
  const hits: CommandHit[] = [
    hit({
      id: "page-patients",
      title: "Patients",
      keywords: "directory clinic",
      kind: "page",
      href: "/admin/patients",
    }),
    hit({
      id: "patient-1",
      title: "Filona Arbeloa",
      subtitle: "01012345678",
      kind: "patient",
      href: "/admin/patients/phone:201012345678",
    }),
    hit({
      id: "public-about",
      title: "About",
      kind: "public",
      href: "/#about",
      keywords: "homepage section",
    }),
  ];

  it("returns browse kinds when the query is empty", () => {
    const result = filterCommandHits(hits, "  ");
    assert.deepEqual(
      result.map((item) => item.id),
      ["page-patients", "public-about"],
    );
  });

  it("matches title, subtitle, and keywords case-insensitively", () => {
    assert.equal(filterCommandHits(hits, "FILO").map((item) => item.id)[0], "patient-1");
    assert.equal(filterCommandHits(hits, "01012").map((item) => item.id)[0], "patient-1");
    assert.equal(filterCommandHits(hits, "Directory").map((item) => item.id)[0], "page-patients");
  });

  it("finds a named patient when the query mixes intent words", () => {
    assert.equal(
      filterCommandHits(hits, "find patient filona").some((item) => item.id === "patient-1"),
      true,
    );
  });

  it("maps synonyms and Arabic intent to the right place", () => {
    const catalog = [
      ...hits,
      hit({
        id: "section:hero",
        title: "القسم الرئيسي",
        kind: "section",
        href: "/admin/customize/hero",
        keywords: "cms customize site hero",
      }),
      hit({
        id: "action-quick-book",
        title: "New reservation",
        kind: "page",
        href: "action:quick-book",
        keywords: "new reservation book appointment booking",
      }),
    ];
    assert.equal(
      filterCommandHits(catalog, "banner").some((item) => item.id === "section:hero"),
      true,
    );
    assert.equal(
      filterCommandHits(catalog, "مريض").some((item) => item.id === "page-patients"),
      true,
    );
    assert.equal(
      filterCommandHits(catalog, "حجز موعد").some(
        (item) => item.id === "action-quick-book",
      ),
      true,
    );
  });

  it("ranks a name match above a generic page", () => {
    const ids = filterCommandHits(hits, "filona").map((item) => item.id);
    assert.equal(ids[0], "patient-1");
  });
});


describe("groupCommandHits", () => {
  it("keeps kind order and drops empty groups", () => {
    const grouped = groupCommandHits([
      hit({ id: "p", title: "Home", kind: "public" }),
      hit({ id: "a", title: "Overview", kind: "page" }),
      hit({ id: "b", title: "Karim", kind: "patient" }),
    ]);
    assert.deepEqual(
      grouped.map((group) => group.kind),
      ["page", "patient", "public"],
    );
    assert.equal(grouped[0]?.items[0]?.id, "a");
  });

  it("caps each group at 8 items", () => {
    const hits = Array.from({ length: 10 }, (_, index) =>
      hit({ id: `p${index}`, title: `Page ${index}`, kind: "page" }),
    );
    const grouped = groupCommandHits(hits);
    assert.equal(grouped[0]?.items.length, 8);
  });
});

describe("buildStaticCommandHits", () => {
  const hits = buildStaticCommandHits({
    pageLabel: (href) =>
      ({
        "/admin": "Overview",
        "/admin/patients": "Patients",
        "/admin/customize": "Customize",
      })[href] ?? href,
    customizeLabel: (section) => section,
    publicHome: "Home",
    publicServices: "Services",
    publicCaseStudies: "Case studies",
    publicFeatured: "Projects",
    publicExperience: "Experience",
    newReservation: "New reservation",
  });

  it("includes admin pages, customize sections, and public homepage anchors", () => {
    const hrefs = new Set(hits.map((item) => item.href));
    assert.equal(hrefs.has("/admin/patients"), true);
    assert.equal(hrefs.has("/admin/customize/hero"), true);
    assert.equal(hrefs.has("/"), true);
    assert.equal(hrefs.has("/services"), true);
    assert.equal(hrefs.has("/#about"), true);
    assert.equal(hrefs.has("/#contact"), true);
    assert.equal(hrefs.has("/experience"), true);
    assert.equal(
      hits.some((item) => item.id === "action-quick-book"),
      true,
    );
  });
});

describe("hitsFromPatients", () => {
  it("maps groups to profile paths and searchable phone/name", () => {
    const [row] = hitsFromPatients([
      {
        patientKey: "phone:201012345678",
        displayName: "Filona Arbeloa",
        phone: "01012345678",
        email: "fil@example.com",
        alternateNames: ["Fil"],
        visits: [],
      },
    ]);
    assert.equal(row?.kind, "patient");
    assert.equal(row?.href, "/admin/patients/phone%3A201012345678");
    assert.match(row?.keywords ?? "", /filona/i);
    assert.match(row?.keywords ?? "", /01012345678/);
  });
});

describe("hitsFromReservations", () => {
  it("links a visit to the reservations search", () => {
    const [row] = hitsFromReservations([
      {
        id: "res-1",
        patient_name: "Karim",
        phone: "0100",
        starts_at: "2026-09-08T10:00:00.000Z",
        service: "Cleaning",
      },
    ]);
    assert.equal(row?.kind, "reservation");
    assert.equal(row?.href.includes("/admin/reservations"), true);
    assert.equal(row?.href.includes("q=Karim"), true);
  });
});

describe("recentHits", () => {
  it("stores newest first and resolves against the index", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
    };
    pushRecentId("b", storage);
    pushRecentId("a", storage);
    const ranked = recentHits(
      [
        hit({ id: "a", title: "A" }),
        hit({ id: "b", title: "B" }),
        hit({ id: "c", title: "C" }),
      ],
      storage,
    );
    assert.deepEqual(
      ranked.map((item) => item.id),
      ["a", "b"],
    );
  });
});
