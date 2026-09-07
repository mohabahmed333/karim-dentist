type Props = {
  letter?: string | null;
  logoUrl?: string | null;
};

export function AboutDropCap({ letter, logoUrl }: Props) {
  const logo = logoUrl?.trim() || null;
  const char = letter?.trim().charAt(0) || "";

  if (logo) {
    return (
      <span className="about-drop-cap about-drop-cap--logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" className="about-drop-cap-logo" />
      </span>
    );
  }

  if (!char) return null;

  return (
    <span className="about-drop-cap" aria-hidden>
      <svg viewBox="0 0 96 96" className="about-drop-cap-svg" role="img">
        <rect
          x="2"
          y="2"
          width="92"
          height="92"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <rect
          x="8"
          y="8"
          width="80"
          height="80"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.55"
        />
        <path
          d="M18 18c6 2 8 8 6 14M78 18c-6 2-8 8-6 14M18 78c6-2 8-8 6-14M78 78c-6-2-8-8-6-14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.7"
        />
        <path
          d="M28 14c4 6 0 10-2 14M68 14c-4 6 0 10 2 14M28 82c4-6 0-10-2-14M68 82c-4-6 0-10 2-14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.45"
        />
        <text
          x="48"
          y="62"
          textAnchor="middle"
          className="about-drop-cap-letter"
        >
          {char.toUpperCase()}
        </text>
      </svg>
    </span>
  );
}
