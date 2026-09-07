import { footerTaglineLines } from "../lib/footerTaglineLines";

type Props = {
  text: string;
  imageUrl?: string | null;
};

export function FooterTagline({ text, imageUrl }: Props) {
  const lines = footerTaglineLines(text);
  const image = imageUrl?.trim() || null;
  const alt = text.trim() || "Footer tagline";

  return (
    <div data-customize-field="footer-tagline">
      <p className="footer-tagline">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="footer-tagline-image" src={image} alt={alt} />
        ) : (
          lines.map((line) => (
            <span key={line} className="footer-tagline-line">
              {line}
            </span>
          ))
        )}
      </p>
    </div>
  );
}
