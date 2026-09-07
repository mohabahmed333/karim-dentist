import { getCaseStudyBySlug } from "@/services/case_studies/queries.server";
import { listSectionsForCaseStudyServer } from "@/services/case_study_sections/queries.server";
import type { ParsedCaseStudySection } from "@/services/case_study_sections";
import type { CaseStudy } from "@/services/case_studies";

export type CaseStudyPageData = {
  study: CaseStudy;
  sections: ParsedCaseStudySection[];
};

export async function getCaseStudyPageData(
  slug: string,
): Promise<CaseStudyPageData | null> {
  const study = await getCaseStudyBySlug(slug);
  if (!study) return null;
  const sections = await listSectionsForCaseStudyServer(study.id, true);
  return { study, sections };
}
