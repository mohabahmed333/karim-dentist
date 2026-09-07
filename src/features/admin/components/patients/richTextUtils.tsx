import { isRichTextEmpty } from "@/lib/richText";

export { isRichTextEmpty };

export function RichTextHtml({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  if (isRichTextEmpty(html)) return null;
  return (
    <div
      className={`rich-text-html prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
