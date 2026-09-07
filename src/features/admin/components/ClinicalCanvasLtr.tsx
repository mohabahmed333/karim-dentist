"use client";

/**
 * Clinical canvases (odontogram, history graph) must not mirror under RTL.
 * Wrap their roots with this component.
 */
export function ClinicalCanvasLtr({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div dir="ltr" className={className} style={{ direction: "ltr" }}>
      {children}
    </div>
  );
}
