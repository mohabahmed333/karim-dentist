import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Hero } from "@/services/hero";

type Props = { hero: Hero | null };

export function HeroCopyFields({ hero }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="kicker">Kicker</Label>
        <Input
          id="kicker"
          name="kicker"
          defaultValue={hero?.kicker ?? ""}
          placeholder="Portfolio · 2026"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="headline">Script title</Label>
          <Input
            id="headline"
            name="headline"
            defaultValue={hero?.headline ?? ""}
            placeholder="Art Director"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accent">Script title (extra)</Label>
          <Input
            id="accent"
            name="accent"
            defaultValue={hero?.accent ?? ""}
            placeholder="Second line or word"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Supporting text</Label>
        <Textarea
          id="body"
          name="body"
          defaultValue={hero?.body ?? ""}
          placeholder="Short line under the headline"
        />
      </div>
    </div>
  );
}
