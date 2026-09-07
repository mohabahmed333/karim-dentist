export function newCaseStudyDefaults(sort_order: number) {
  return {
    title: "Untitled",
    title_ar: "",
    description: "",
    description_ar: "",
    sort_order,
    is_published: true,
  };
}

export function newFeaturedDefaults(sort_order: number) {
  return {
    title: "Untitled",
    title_ar: "",
    eyebrow: "",
    eyebrow_ar: "",
    sort_order,
    is_published: true,
  };
}

export function newServiceDefaults(
  sort_order: number,
  kind: "our_services" | "laser" = "our_services",
) {
  return {
    title: "Untitled",
    title_ar: "",
    tags: [] as string[],
    description: "",
    description_ar: "",
    kind,
    sort_order,
    is_published: true,
  };
}
