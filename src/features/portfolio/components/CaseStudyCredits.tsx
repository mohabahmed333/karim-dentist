import type { Tables } from "@/lib/supabase/database.types";

type Props = {
  item: Tables<"case_studies">;
  showDetailLink?: boolean;
};

export function CaseStudyCredits({ item, showDetailLink = true }: Props) {
  return (
    <div className="case-footer">
      <div className="case-credits-block">
        <p className="case-credits-label">
          {showDetailLink ? "Credits →" : "Credits"}
        </p>
        <dl className="case-credits">
          {item.client ? (
            <>
              <dt>Client</dt>
              <dd data-customize-field="client">{item.client}</dd>
            </>
          ) : null}
          {item.agency ? (
            <>
              <dt>Agency</dt>
              <dd data-customize-field="agency">{item.agency}</dd>
            </>
          ) : null}
          {item.director ? (
            <>
              <dt>Director</dt>
              <dd data-customize-field="director">{item.director}</dd>
            </>
          ) : null}
          {item.production_company ? (
            <>
              <dt>Production</dt>
              <dd data-customize-field="production_company">
                {item.production_company}
              </dd>
            </>
          ) : null}
        </dl>
      </div>
      {showDetailLink ? (
        <span className="case-more" data-customize-ignore="">
          For more project details…
        </span>
      ) : null}
    </div>
  );
}
