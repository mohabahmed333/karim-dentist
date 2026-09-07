import type { CaseStudy } from "@/services/case_studies";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const fields = [
  "title",
  "description",
  "year",
  "category",
  "client",
  "director",
  "agency",
  "production_company",
] as const;

type Props = { item: CaseStudy };

export function CaseStudyFields({ item }: Props) {
  return (
    <>
      {fields.map((name) => (
        <div key={name} className="space-y-2">
          <Label htmlFor={name}>{name}</Label>
          {name === "description" ? (
            <Textarea
              id={name}
              name={name}
              defaultValue={item[name] ?? ""}
              key={item.id + name}
            />
          ) : (
            <Input
              id={name}
              name={name}
              type={name === "year" ? "number" : "text"}
              inputMode={name === "year" ? "numeric" : undefined}
              min={name === "year" ? 1990 : undefined}
              max={name === "year" ? new Date().getFullYear() + 2 : undefined}
              step={name === "year" ? 1 : undefined}
              placeholder={name === "year" ? "YYYY" : undefined}
              defaultValue={item[name] ?? ""}
              key={item.id + name}
            />
          )}
        </div>
      ))}
      <div className="space-y-2">
        <Label htmlFor="tags">tags (comma-separated)</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={item.tags?.join(", ") ?? ""}
          key={item.id + "tags"}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="is_published">status</Label>
        <select
          id="is_published"
          name="is_published"
          defaultValue={item.is_published ? "true" : "false"}
          key={item.id + "pub"}
          className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="false">Draft</option>
          <option value="true">Published</option>
        </select>
      </div>
    </>
  );
}
