import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterAdminNavSections,
  findActiveAdminNavGroupIds,
  flattenAdminNavItems,
  type AdminNavSection,
} from "./adminNav";

const nestedFixture: AdminNavSection[] = [
  {
    id: "test-section",
    titleKey: "admin.nav.clinic",
    entries: [
      { href: "/admin/a", labelKey: "admin.nav.overview" },
      {
        id: "group-a",
        labelKey: "admin.nav.overview",
        items: [
          { href: "/admin/b", labelKey: "admin.nav.overview", permission: "b.view" },
          {
            id: "group-a-sub",
            labelKey: "admin.nav.overview",
            items: [
              { href: "/admin/c", labelKey: "admin.nav.overview", permission: "c.view" },
            ],
          },
        ],
      },
    ],
  },
];

describe("filterAdminNavSections (recursive)", () => {
  it("keeps every level unchanged when permissions is null (fails open)", () => {
    const result = filterAdminNavSections(nestedFixture, null);
    assert.deepEqual(result, nestedFixture);
  });

  it("collapses only the sub-group whose sole item is unpermitted, keeping the parent group", () => {
    const result = filterAdminNavSections(nestedFixture, new Set(["b.view"]));
    const groupA = result[0]!.entries!.find(
      (e) => "id" in e && e.id === "group-a",
    );
    assert.ok(groupA && "items" in groupA);
    assert.deepEqual(
      (groupA as { items: unknown[] }).items.map((i) => (i as { href: string }).href),
      ["/admin/b"],
    );
  });

  it("collapses a group two levels deep when nothing inside it is permitted", () => {
    const result = filterAdminNavSections(nestedFixture, new Set());
    const ids = result[0]!.entries!.map((e) => ("href" in e ? e.href : e.id));
    assert.deepEqual(ids, ["/admin/a"]);
  });
});

describe("flattenAdminNavItems (recursive)", () => {
  it("reaches an item nested two levels deep, including the sub-group's own link", () => {
    const fixture: AdminNavSection[] = [
      {
        id: "s",
        titleKey: "admin.nav.clinic",
        entries: [
          { href: "/admin/a", labelKey: "admin.nav.overview" },
          {
            id: "g",
            labelKey: "admin.nav.overview",
            items: [
              { href: "/admin/b", labelKey: "admin.nav.overview" },
              {
                id: "g2",
                href: "/admin/g2",
                labelKey: "admin.nav.overview",
                items: [{ href: "/admin/c", labelKey: "admin.nav.overview" }],
              },
            ],
          },
        ],
      },
    ];
    const hrefs = flattenAdminNavItems(fixture).map((item) => item.href);
    assert.deepEqual(hrefs, ["/admin/a", "/admin/b", "/admin/g2", "/admin/c"]);
  });
});

describe("findActiveAdminNavGroupIds (recursive, Set-returning)", () => {
  const fixture: AdminNavSection[] = [
    {
      id: "site",
      titleKey: "admin.nav.site",
      entries: [
        {
          id: "settings",
          labelKey: "admin.nav.settings",
          items: [
            {
              id: "settings-clinic",
              labelKey: "admin.settings.groupClinic",
              items: [
                { href: "/admin/settings/clinic-hours", labelKey: "admin.settings.hours" },
              ],
            },
          ],
        },
        {
          id: "inventory",
          href: "/admin/inventory",
          labelKey: "admin.nav.inventory",
          items: [
            { href: "/admin/inventory/reports", labelKey: "admin.nav.inventoryReports" },
          ],
        },
      ],
    },
  ];

  it("adds both the group and the sub-group on the path to a doubly-nested active page", () => {
    const ids = findActiveAdminNavGroupIds(fixture, "/admin/settings/clinic-hours");
    assert.deepEqual([...ids].sort(), ["settings", "settings-clinic"]);
  });

  it("adds a group whose own href matches, even with no active descendant", () => {
    const ids = findActiveAdminNavGroupIds(fixture, "/admin/inventory");
    assert.deepEqual([...ids], ["inventory"]);
  });

  it("returns an empty set when nothing matches", () => {
    const ids = findActiveAdminNavGroupIds(fixture, "/admin/unrelated-page");
    assert.deepEqual([...ids], []);
  });
});
