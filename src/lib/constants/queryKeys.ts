export const queryKeys = {
  siteSettings: {
    all: ["site_settings"] as const,
    detail: () => [...queryKeys.siteSettings.all, "detail"] as const,
  },
  hero: {
    all: ["hero"] as const,
    detail: () => [...queryKeys.hero.all, "detail"] as const,
  },
  about: {
    all: ["about"] as const,
    detail: () => [...queryKeys.about.all, "detail"] as const,
  },
  callouts: {
    all: ["callouts"] as const,
    detail: () => [...queryKeys.callouts.all, "detail"] as const,
  },
  caseStudies: {
    all: ["case_studies"] as const,
    list: () => [...queryKeys.caseStudies.all, "list"] as const,
  },
  featuredProjects: {
    all: ["featured_projects"] as const,
    list: () => [...queryKeys.featuredProjects.all, "list"] as const,
  },
  experience: {
    all: ["experience_entries"] as const,
    list: () => [...queryKeys.experience.all, "list"] as const,
  },
  clients: {
    all: ["clients"] as const,
    list: () => [...queryKeys.clients.all, "list"] as const,
  },
  footerLinks: {
    all: ["footer_links"] as const,
    list: () => [...queryKeys.footerLinks.all, "list"] as const,
  },
  socialLinks: {
    all: ["social_links"] as const,
    list: () => [...queryKeys.socialLinks.all, "list"] as const,
  },
  profile: {
    me: ["profile", "me"] as const,
  },
  reservations: {
    all: ["reservations"] as const,
    list: () => [...queryKeys.reservations.all, "list"] as const,
  },
};
