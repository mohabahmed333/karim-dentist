import {
  updateGalleryComparison,
  updateGalleryItem,
  updateSolutionPanel,
  updateTrustItem,
  upsertGalleryShowcase,
} from "@/services/dental/mutations";
import type { PortfolioData } from "@/services/portfolio";

export async function persistTrustItem(
  id: string,
  data: PortfolioData,
): Promise<void> {
  const row = data.trustItems.find((item) => item.id === id);
  if (row) await updateTrustItem(id, row);
}

export async function persistSolutionPanel(
  id: string,
  data: PortfolioData,
): Promise<void> {
  const row = data.solutionPanels.find((item) => item.id === id);
  if (row) await updateSolutionPanel(id, row);
}

export async function persistGalleryItem(
  id: string,
  data: PortfolioData,
): Promise<void> {
  const row = data.galleryItems.find((item) => item.id === id);
  if (row) await updateGalleryItem(id, row);
}

export async function persistGalleryComparison(
  id: string,
  data: PortfolioData,
): Promise<void> {
  const row = data.galleryComparisons.find((item) => item.id === id);
  if (row) await updateGalleryComparison(id, row);
}

export async function persistGalleryShowcase(data: PortfolioData): Promise<void> {
  if (data.galleryShowcase) {
    await upsertGalleryShowcase(data.galleryShowcase, data.galleryShowcase);
  }
}
