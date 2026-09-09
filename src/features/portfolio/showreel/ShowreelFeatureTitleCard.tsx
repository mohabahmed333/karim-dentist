import { ShowreelAnimatedText } from "./ShowreelAnimatedText";

type Props = {
  kicker: string;
  title: string;
  body: string;
};

export function ShowreelFeatureTitleCard({ kicker, title, body }: Props) {
  return (
    <div className="showreel-feature-title-card" role="presentation">
      <p className="showreel-kicker showreel-anim-kicker">{kicker}</p>
      <h2 className="showreel-headline showreel-anim-title">
        <ShowreelAnimatedText text={title} />
      </h2>
      {body ? (
        <p className="showreel-lede showreel-anim-body">{body}</p>
      ) : null}
    </div>
  );
}
