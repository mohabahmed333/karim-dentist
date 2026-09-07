"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PortfolioData } from "@/services/portfolio";
import {
  defaultContentForType,
  parseSectionContent,
  type SectionContent,
  type SectionType,
} from "@/services/case_study_sections";
import type { ParsedFeaturedSection } from "@/services/featured_project_sections";
import {
  createFeaturedPageSection,
  duplicateFeaturedSection,
  softDeleteFeaturedSection,
} from "../lib/featuredSectionPersistApi";
import {
  insertFeaturedSection,
  nextFeaturedSectionSortOrder,
  patchFeaturedSection,
  removeFeaturedSection,
  reorderFeaturedSections,
  reorderFeaturedSectionsToIndex,
  replaceFeaturedSectionId,
} from "../context/featuredSectionHelpers";
import type { SaveStatus } from "../types";

function tempSectionId(): string {
  return `temp-${crypto.randomUUID()}`;
}

function toParsedSection(
  row: Awaited<ReturnType<typeof createFeaturedPageSection>>,
): ParsedFeaturedSection {
  const type = row.type as SectionType;
  return {
    ...row,
    type,
    content: parseSectionContent(type, row.content),
  };
}

export function useFeaturedSectionActions(
  data: PortfolioData,
  setData: Dispatch<SetStateAction<PortfolioData>>,
  enqueue: (key: string) => void,
  setStatus: Dispatch<SetStateAction<SaveStatus>>,
  setSnapshot: Dispatch<SetStateAction<PortfolioData>>,
) {
  const patchSection = useCallback(
    (
      featuredProjectId: string,
      sectionId: string,
      partial: Partial<ParsedFeaturedSection> & { content?: SectionContent },
    ) => {
      setData((current) =>
        patchFeaturedSection(current, featuredProjectId, sectionId, partial),
      );
      enqueue(`fp-section:${featuredProjectId}:${sectionId}`);
    },
    [enqueue, setData],
  );

  const reorderSection = useCallback(
    (
      featuredProjectId: string,
      sectionId: string,
      direction: "up" | "down",
    ) => {
      setData((current) =>
        reorderFeaturedSections(current, featuredProjectId, sectionId, direction),
      );
      enqueue(`fp-section-order:${featuredProjectId}`);
    },
    [enqueue, setData],
  );

  const reorderSectionToIndex = useCallback(
    (featuredProjectId: string, fromIndex: number, toIndex: number) => {
      setData((current) =>
        reorderFeaturedSectionsToIndex(
          current,
          featuredProjectId,
          fromIndex,
          toIndex,
        ),
      );
      enqueue(`fp-section-order:${featuredProjectId}`);
    },
    [enqueue, setData],
  );

  const addSection = useCallback(
    async (
      featuredProjectId: string,
      type: SectionType,
      options?: {
        layoutVariant?: string;
        content?: SectionContent;
      },
    ) => {
      const tempId = tempSectionId();
      const sortOrder = nextFeaturedSectionSortOrder(data, featuredProjectId);
      const content = options?.content ?? defaultContentForType(type);
      const layout_variant = options?.layoutVariant ?? "default";
      const optimistic: ParsedFeaturedSection = {
        id: tempId,
        featured_project_id: featuredProjectId,
        type,
        layout_variant,
        content,
        sort_order: sortOrder,
        is_visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };
      setData((current) =>
        insertFeaturedSection(current, featuredProjectId, optimistic),
      );
      setStatus("saving");
      try {
        const created = toParsedSection(
          await createFeaturedPageSection(featuredProjectId, type, sortOrder, {
            layoutVariant: layout_variant,
            content,
          }),
        );
        setData((current) =>
          replaceFeaturedSectionId(current, featuredProjectId, tempId, created),
        );
        setSnapshot((current) => {
          const hasTemp = (
            current.featuredProjectSections[featuredProjectId] ?? []
          ).some((section) => section.id === tempId);
          return hasTemp
            ? replaceFeaturedSectionId(
                current,
                featuredProjectId,
                tempId,
                created,
              )
            : insertFeaturedSection(current, featuredProjectId, created);
        });
        setStatus("saved");
        return created.id;
      } catch (err) {
        setData((current) =>
          removeFeaturedSection(current, featuredProjectId, tempId),
        );
        setStatus("error");
        throw err;
      }
    },
    [data, setData, setSnapshot, setStatus],
  );

  const duplicate = useCallback(
    async (featuredProjectId: string, sectionId: string) => {
      const source = (data.featuredProjectSections[featuredProjectId] ?? []).find(
        (section) => section.id === sectionId,
      );
      if (!source) return null;
      const sortOrder = nextFeaturedSectionSortOrder(data, featuredProjectId);
      setStatus("saving");
      try {
        const created = toParsedSection(
          await duplicateFeaturedSection(
            {
              id: source.id,
              featured_project_id: source.featured_project_id,
              type: source.type,
              layout_variant: source.layout_variant,
              content: source.content as never,
              sort_order: source.sort_order,
              is_visible: source.is_visible,
              created_at: source.created_at,
              updated_at: source.updated_at,
              deleted_at: source.deleted_at,
            },
            sortOrder,
          ),
        );
        setData((current) =>
          insertFeaturedSection(current, featuredProjectId, created),
        );
        setSnapshot((current) =>
          insertFeaturedSection(current, featuredProjectId, created),
        );
        setStatus("saved");
        return created.id;
      } catch (err) {
        setStatus("error");
        throw err;
      }
    },
    [data, setData, setSnapshot, setStatus],
  );

  const removeSection = useCallback(
    async (featuredProjectId: string, sectionId: string) => {
      setData((current) =>
        removeFeaturedSection(current, featuredProjectId, sectionId),
      );
      setStatus("saving");
      try {
        if (!sectionId.startsWith("temp-")) {
          await softDeleteFeaturedSection(sectionId);
        }
        setSnapshot((current) =>
          removeFeaturedSection(current, featuredProjectId, sectionId),
        );
        setStatus("saved");
      } catch (err) {
        setStatus("error");
        throw err;
      }
    },
    [setData, setSnapshot, setStatus],
  );

  return {
    patchFeaturedSection: patchSection,
    reorderFeaturedSection: reorderSection,
    reorderFeaturedSectionToIndex: reorderSectionToIndex,
    addFeaturedSection: addSection,
    duplicateFeaturedSection: duplicate,
    removeFeaturedSection: removeSection,
  };
}
