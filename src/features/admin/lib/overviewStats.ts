import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export async function loadOverviewCounts(supabase: ServerClient) {
  const [cases, featured, services, clients, experience, footer, hero] =
    await Promise.all([
      supabase
        .from("case_studies")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase
        .from("featured_projects")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase
        .from("services")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase
        .from("experience_entries")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase
        .from("footer_links")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase.from("hero").select("headline").limit(1).maybeSingle(),
    ]);

  return {
    cases: cases.count ?? 0,
    featured: featured.count ?? 0,
    services: services.count ?? 0,
    clients: clients.count ?? 0,
    experience: experience.count ?? 0,
    footer: footer.count ?? 0,
    heroHeadline: hero.data?.headline ?? "—",
  };
}

export function overviewStatCards(
  counts: Awaited<ReturnType<typeof loadOverviewCounts>>,
) {
  return [
    {
      href: "/admin/homepage-order",
      label: "Homepage order",
      value: "Reorder sections",
    },
    {
      href: "/admin/case-studies",
      label: "Case studies",
      value: String(counts.cases),
    },
    {
      href: "/admin/featured",
      label: "Featured",
      value: String(counts.featured),
    },
    {
      href: "/admin/services",
      label: "Services",
      value: String(counts.services),
    },
    {
      href: "/admin/clients",
      label: "Clients",
      value: String(counts.clients),
    },
    {
      href: "/admin/experience",
      label: "Experience",
      value: String(counts.experience),
    },
    {
      href: "/admin/footer-links",
      label: "Footer links",
      value: String(counts.footer),
    },
    { href: "/admin/hero", label: "Hero", value: counts.heroHeadline },
  ];
}
