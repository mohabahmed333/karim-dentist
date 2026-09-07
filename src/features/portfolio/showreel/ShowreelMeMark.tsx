/** ME monogram mark for Mohab Elbasiry (showreel brand). */
export function ShowreelMeMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={["showreel-me-mark", className].filter(Boolean).join(" ")}
      aria-label="ME"
    >
      <span className="showreel-me-mark-letter" aria-hidden>
        M
      </span>
      <span className="showreel-me-mark-letter showreel-me-mark-letter--e" aria-hidden>
        E
      </span>
    </span>
  );
}
