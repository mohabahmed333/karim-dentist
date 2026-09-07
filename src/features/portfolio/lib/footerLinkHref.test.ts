import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { resolveFooterLink } from "./footerLinkHref.ts";

function link(partial: {
  label: string;
  href: string;
}): Parameters<typeof resolveFooterLink>[0] {
  return {
    id: "1",
    column_key: "portfolio",
    label: partial.label,
    href: partial.href,
    sort_order: 1,
    display_mode: "text",
    icon_key: null,
    icon_url: null,
    created_at: "",
    updated_at: "",
    deleted_at: null,
  };
}

test("maps hash footer links to homepage paths", () => {
  assert.equal(resolveFooterLink(link({ label: "About", href: "#about" })).href, "/#about");
  assert.equal(resolveFooterLink(link({ label: "Home", href: "#top" })).href, "/");
});

test("maps contact footer link to popup action", () => {
  assert.equal(
    resolveFooterLink(link({ label: "Contact", href: "#contact" })).href,
    "#contact-popup",
  );
});

test("maps collection footer links to index routes", () => {
  assert.equal(
    resolveFooterLink(link({ label: "Case Studies", href: "/case-studies" })).href,
    "/case-studies",
  );
  assert.equal(
    resolveFooterLink(link({ label: "Featured Projects", href: "/featured" })).href,
    "/featured",
  );
  assert.equal(
    resolveFooterLink(link({ label: "Projects", href: "#featured" })).href,
    "/featured",
  );
});

test("does not remap Services hash link to featured projects", () => {
  const resolved = resolveFooterLink(link({ label: "Services", href: "#services" }));
  assert.equal(resolved.href, "/#services");
  assert.equal(resolved.label, "Services");
});
