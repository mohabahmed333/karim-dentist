import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/lib/i18n";
import type { Hero } from "@/services/hero";

type Props = { hero: Hero | null };

export function HeroCopyFields({ hero }: Props) {
  const t = useTranslations();
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="kicker">{t("admin.pages.hero.kicker")}</Label>
        <Input
          id="kicker"
          name="kicker"
          defaultValue={hero?.kicker ?? ""}
          placeholder={t("admin.pages.hero.kickerPlaceholder")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="headline">{t("admin.pages.hero.scriptTitle")}</Label>
          <Input
            id="headline"
            name="headline"
            defaultValue={hero?.headline ?? ""}
            placeholder={t("admin.pages.hero.scriptTitlePlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accent">{t("admin.pages.hero.scriptTitleExtra")}</Label>
          <Input
            id="accent"
            name="accent"
            defaultValue={hero?.accent ?? ""}
            placeholder={t("admin.pages.hero.scriptTitleExtraPlaceholder")}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">{t("admin.pages.hero.supportingText")}</Label>
        <Textarea
          id="body"
          name="body"
          defaultValue={hero?.body ?? ""}
          placeholder={t("admin.pages.hero.supportingTextPlaceholder")}
        />
      </div>
    </div>
  );
}
