import type { Tables } from "@/lib/supabase/database.types";
import { SectionHeading } from "./SectionHeading";

type ExperienceProps = {
  items: Tables<"experience_entries">[];
};

type EntryProps = {
  item: Tables<"experience_entries">;
};

/** Prefer a 4-digit year for the left column, matching the reference. */
function yearLabel(dateLabel: string | null | undefined) {
  if (!dateLabel) return null;
  const match = dateLabel.match(/\d{4}/);
  return match?.[0] ?? dateLabel;
}

function ExperienceEntry({ item }: EntryProps) {
  const year = yearLabel(item.date_label);

  return (
    <article
      id={`customize-item-${item.id}`}
      className="experience-entry"
      data-customize-item={item.id}
    >
      {year ? (
        <time className="experience-year" data-customize-field="date_label">
          {year}
        </time>
      ) : (
        <span className="experience-year experience-year--empty" aria-hidden />
      )}
      <div className="experience-copy">
        <h3 data-customize-field="title">{item.title}</h3>
        {item.org ? (
          <p className="experience-org" data-customize-field="org">
            {item.org}
          </p>
        ) : null}
        {item.description ? (
          <p className="experience-desc" data-customize-field="description">
            {item.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function ExperienceSection({ items }: ExperienceProps) {
  if (!items.length) return null;
  return (
    <section
      className="experience"
      id="experience"
      data-customize-section="experience"
    >
      <div className="experience-inner">
        <SectionHeading>Experience</SectionHeading>
        <div className="experience-list">
          {items.map((item) => (
            <ExperienceEntry key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
