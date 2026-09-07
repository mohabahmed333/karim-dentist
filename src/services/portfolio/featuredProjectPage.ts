import { getFeaturedBySlug } from "@/services/featured_projects/queries.server";
import { listSectionsForFeaturedProjectServer } from "@/services/featured_project_sections/queries.server";
import type { ParsedFeaturedSection } from "@/services/featured_project_sections";
import type { FeaturedProject } from "@/services/featured_projects";

export type FeaturedProjectPageData = {
  project: FeaturedProject;
  sections: ParsedFeaturedSection[];
};

export async function getFeaturedProjectPageData(
  slug: string,
): Promise<FeaturedProjectPageData | null> {
  const project = await getFeaturedBySlug(slug);
  if (!project) return null;
  const sections = await listSectionsForFeaturedProjectServer(project.id, true);
  return { project, sections };
}
