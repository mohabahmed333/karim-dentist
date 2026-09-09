import { ShowreelAnimatedText } from "./ShowreelAnimatedText";

type Props = {
  title: string;
};

/** Title only — the kicker and description were dropped so the header is a
    single line that sits level with the brand mark, and the device card
    keeps the height they used to take. */
export function ShowreelFeatureTitleCard({ title }: Props) {
  return (
    <div className="showreel-feature-title-card" role="presentation">
      <h2 className="showreel-headline showreel-anim-title">
        <ShowreelAnimatedText text={title} />
      </h2>
    </div>
  );
}
