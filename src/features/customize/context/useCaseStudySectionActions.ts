"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PortfolioData } from "@/services/portfolio";
import {
  defaultContentForType,
  parseSectionContent,
  type ParsedCaseStudySection,
  type SectionContent,
  type SectionType,
} from "@/services/case_study_sections";
import {
  createCaseStudySection,
  duplicateSection,
  softDeleteSection,
} from "../lib/sectionPersistApi";
import {
  insertCaseStudySection,
  nextSectionSortOrder,
  patchCaseStudySection,
  removeCaseStudySection,
  reorderCaseStudySections,
  reorderCaseStudySectionsToIndex,
  replaceCaseStudySectionId,
} from "./sectionHelpers";
import type { SaveStatus } from "../types";

function tempSectionId(): string {
  return `temp-${crypto.randomUUID()}`;
}

function toParsedSection(
  row: Awaited<ReturnType<typeof createCaseStudySection>>,
): ParsedCaseStudySection {
  const type = row.type as SectionType;
  return {
    ...row,
    type,
    content: parseSectionContent(type, row.content),
  };
}

export function useCaseStudySectionActions(
  data: PortfolioData,
  setData: Dispatch<SetStateAction<PortfolioData>>,
  enqueue: (key: string) => void,
  setStatus: Dispatch<SetStateAction<SaveStatus>>,
  setSnapshot: Dispatch<SetStateAction<PortfolioData>>,
) {
  const patchSection = useCallback(
    (
      caseStudyId: string,
      sectionId: string,
      partial: Partial<ParsedCaseStudySection> & { content?: SectionContent },
    ) => {
      setData((current) =>
        patchCaseStudySection(current, caseStudyId, sectionId, partial),
      );
      enqueue(`cs-section:${caseStudyId}:${sectionId}`);
    },
    [enqueue, setData],
  );

  const reorderSection = useCallback(
    (
      caseStudyId: string,
      sectionId: string,
      direction: "up" | "down",
    ) => {
      setData((current) =>
        reorderCaseStudySections(current, caseStudyId, sectionId, direction),
      );
      enqueue(`cs-section-order:${caseStudyId}`);
    },
    [enqueue, setData],
  );

  const reorderSectionToIndex = useCallback(
    (caseStudyId: string, fromIndex: number, toIndex: number) => {
      setData((current) =>
        reorderCaseStudySectionsToIndex(
          current,
          caseStudyId,
          fromIndex,
          toIndex,
        ),
      );
      enqueue(`cs-section-order:${caseStudyId}`);
    },
    [enqueue, setData],
  );

  const addSection = useCallback(
    async (
      caseStudyId: string,
      type: SectionType,
      options?: {
        layoutVariant?: string;
        content?: SectionContent;
      },
    ) => {
      const tempId = tempSectionId();
      const sortOrder = nextSectionSortOrder(data, caseStudyId);
      const content = options?.content ?? defaultContentForType(type);
      const layout_variant = options?.layoutVariant ?? "default";
      const optimistic: ParsedCaseStudySection = {
        id: tempId,
        case_study_id: caseStudyId,
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
        insertCaseStudySection(current, caseStudyId, optimistic),
      );
      setStatus("saving");
      try {
        const created = toParsedSection(
          await createCaseStudySection(caseStudyId, type, sortOrder, {
            layoutVariant: layout_variant,
            content,
          }),
        );
        setData((current) =>
          replaceCaseStudySectionId(current, caseStudyId, tempId, created),
        );
        setSnapshot((current) => {
          const hasTemp = (current.caseStudySections[caseStudyId] ?? []).some(
            (section) => section.id === tempId,
          );
          return hasTemp
            ? replaceCaseStudySectionId(current, caseStudyId, tempId, created)
            : insertCaseStudySection(current, caseStudyId, created);
        });
        setStatus("saved");
        return created.id;
      } catch (err) {
        setData((current) =>
          removeCaseStudySection(current, caseStudyId, tempId),
        );
        setStatus("error");
        throw err;
      }
    },
    [data, setData, setSnapshot, setStatus],
  );

  const duplicate = useCallback(
    async (caseStudyId: string, sectionId: string) => {
      const source = (data.caseStudySections[caseStudyId] ?? []).find(
        (section) => section.id === sectionId,
      );
      if (!source) return null;
      const sortOrder = nextSectionSortOrder(data, caseStudyId);
      setStatus("saving");
      try {
        const created = toParsedSection(
          await duplicateSection(
            {
              id: source.id,
              case_study_id: source.case_study_id,
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
          insertCaseStudySection(current, caseStudyId, created),
        );
        setSnapshot((current) =>
          insertCaseStudySection(current, caseStudyId, created),
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
    async (caseStudyId: string, sectionId: string) => {
      setData((current) =>
        removeCaseStudySection(current, caseStudyId, sectionId),
      );
      setStatus("saving");
      try {
        if (!sectionId.startsWith("temp-")) {
          await softDeleteSection(sectionId);
        }
        setSnapshot((current) =>
          removeCaseStudySection(current, caseStudyId, sectionId),
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
    patchCaseStudySection: patchSection,
    reorderCaseStudySection: reorderSection,
    reorderCaseStudySectionToIndex: reorderSectionToIndex,
    addCaseStudySection: addSection,
    duplicateCaseStudySection: duplicate,
    removeCaseStudySection: removeSection,
  };
}
