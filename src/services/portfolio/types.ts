import type { Tables } from "@/lib/supabase/database.types";
import type { ParsedCaseStudySection } from "@/services/case_study_sections";
import type { ParsedFeaturedSection } from "@/services/featured_project_sections";
import type {
  GalleryComparison,
  GalleryItem,
  GalleryShowcase,
  SolutionPanel,
  TrustItem,
} from "@/services/dental/types";

export type PortfolioData = {
  settings: Tables<"site_settings"> | null;
  hero: Tables<"hero"> | null;
  about: Tables<"about"> | null;
  callout: Tables<"callouts"> | null;
  caseStudies: Tables<"case_studies">[];
  caseStudySections: Record<string, ParsedCaseStudySection[]>;
  caseStudyDetailPageIds: string[];
  featured: Tables<"featured_projects">[];
  featuredProjectSections: Record<string, ParsedFeaturedSection[]>;
  featuredDetailPageIds: string[];
  experience: Tables<"experience_entries">[];
  services: Tables<"services">[];
  clients: Tables<"clients">[];
  footerLinks: Tables<"footer_links">[];
  socialLinks: Tables<"social_links">[];
  trustItems: TrustItem[];
  solutionPanels: SolutionPanel[];
  galleryItems: GalleryItem[];
  galleryShowcase: GalleryShowcase | null;
  galleryComparisons: GalleryComparison[];
};
