import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Hero } from "@/services/hero";

type Props = { hero: Hero | null };

export function HeroCtaFields({ hero }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="cta_primary_label">Primary CTA label</Label>
        <Input
          id="cta_primary_label"
          name="cta_primary_label"
          defaultValue={hero?.cta_primary_label ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cta_primary_href">Primary CTA link</Label>
        <Input
          id="cta_primary_href"
          name="cta_primary_href"
          defaultValue={hero?.cta_primary_href ?? ""}
          placeholder="#case-studies"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cta_secondary_label">Secondary CTA label</Label>
        <Input
          id="cta_secondary_label"
          name="cta_secondary_label"
          defaultValue={hero?.cta_secondary_label ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cta_secondary_href">Secondary CTA link</Label>
        <Input
          id="cta_secondary_href"
          name="cta_secondary_href"
          defaultValue={hero?.cta_secondary_href ?? ""}
          placeholder="#contact"
        />
      </div>
    </div>
  );
}
