type Props = {
  children: React.ReactNode;
  /** Extra class on the header wrapper (e.g. flush padding overrides). */
  className?: string;
};

export function SectionHeading({ children, className }: Props) {
  return (
    <header
      className={className ? `section-header ${className}` : "section-header"}
    >
      <h2 className="section-heading">{children}</h2>
    </header>
  );
}
