import type { PortfolioData } from "@/services/portfolio";
import { buildWorkNavLinks } from "../components/navMenuGroups";
import { isSitePageSectionVisible } from "./homepageSectionNav";

export function workNavLinksFromPortfolio(portfolio: PortfolioData) {
  const hidden = portfolio.settings?.homepage_hidden_sections;
  const caseCount = isSitePageSectionVisible("case-studies", hidden)
    ? portfolio.caseStudies.length
    : 0;
  const featuredCount = isSitePageSectionVisible("featured", hidden)
    ? portfolio.featured.length
    : 0;
  return buildWorkNavLinks(caseCount, featuredCount);
}
