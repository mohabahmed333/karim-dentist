"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import type { EditorView } from "@tiptap/pm/view";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Link2,
  Image as ImageIcon,
} from "lucide-react";
import { useTranslations } from "@/lib/i18n";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeightClass?: string;
  /** When set, enables pasting/dropping an image straight into the editor
   * (and a toolbar button to pick one) — resolve to the image's public URL,
   * e.g. after uploading it to storage. Omit to leave images unsupported,
   * exactly as before. */
  onImageUpload?: (file: File) => Promise<string>;
  /** Focus the editor once it mounts — for a freshly created, empty note. */
  autoFocus?: boolean;
  /** Extra classes for the outer wrapper — e.g. "flex-1 min-h-0" to let it
   * fill a flex parent instead of growing with its content. */
  className?: string;
  /** Cap the editor's own content to the wrapper's height and scroll inside
   * it, rather than growing the whole editor to fit the text. */
  scrollable?: boolean;
};

function insertImage(view: EditorView, url: string) {
  const { schema } = view.state;
  const node = schema.nodes.image?.create({ src: url });
  if (!node) return;
  view.dispatch(view.state.tr.replaceSelectionWith(node));
}

/** Claims (and uploads) the first image found in a paste/drop; returns
 * whether it handled the event so Tiptap's default handling is skipped. */
function handleImageFiles(
  view: EditorView,
  files: File[],
  onImageUpload: (file: File) => Promise<string>,
): boolean {
  const image = files.find((file) => file.type.startsWith("image/"));
  if (!image) return false;
  void onImageUpload(image)
    .then((url) => insertImage(view, url))
    .catch(() => undefined);
  return true;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled,
  minHeightClass = "min-h-28",
  onImageUpload,
  autoFocus,
  className,
  scrollable,
}: Props) {
  const t = useTranslations();
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Placeholder.configure({ placeholder: placeholder ?? t("admin.richText.write") }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-blue-600 underline" } }),
      ...(onImageUpload ? [Image as unknown as Extension] : []),
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class: `rich-text-editor prose prose-sm max-w-none px-3 py-2 outline-none ${minHeightClass}`,
      },
      handlePaste: onImageUpload
        ? (view, event) => {
            const files = Array.from(event.clipboardData?.files ?? []);
            return handleImageFiles(view, files, onImageUpload);
          }
        : undefined,
      handleDrop: onImageUpload
        ? (view, event) => {
            const files = Array.from(event.dataTransfer?.files ?? []);
            return handleImageFiles(view, files, onImageUpload);
          }
        : undefined,
    },
  });

  useEffect(() => {
    if (autoFocus && editor) editor.chain().focus("end").run();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focus once, on mount only
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg bg-[#f2f2f2] ${disabled ? "opacity-60" : ""} ${className ?? ""}`}
    >
      <Toolbar editor={editor} disabled={Boolean(disabled)} t={t} onImageUpload={onImageUpload} />
      {scrollable ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}

function Toolbar({
  editor,
  disabled,
  t,
  onImageUpload,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>;
  disabled: boolean;
  t: ReturnType<typeof useTranslations>;
  onImageUpload?: (file: File) => Promise<string>;
}) {
  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(t("admin.richText.linkUrl"), prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function pickImage() {
    if (!onImageUpload) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      void onImageUpload(file).then((url) => {
        editor.chain().focus().setImage({ src: url }).run();
      });
    };
    input.click();
  }

  const btn =
    "rounded p-1.5 text-[#6b7280] hover:bg-white hover:text-[#111827] disabled:opacity-40";
  const on = "bg-white text-[#111827]";

  return (
    <div className="flex flex-wrap gap-0.5 border-b border-[#e5e7eb] px-1.5 py-1">
      <button type="button" disabled={disabled} className={`${btn} ${editor.isActive("bold") ? on : ""}`} onClick={() => editor.chain().focus().toggleBold().run()} aria-label={t("admin.richText.bold")}><Bold className="size-3.5" /></button>
      <button type="button" disabled={disabled} className={`${btn} ${editor.isActive("italic") ? on : ""}`} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label={t("admin.richText.italic")}><Italic className="size-3.5" /></button>
      <button type="button" disabled={disabled} className={`${btn} ${editor.isActive("underline") ? on : ""}`} onClick={() => editor.chain().focus().toggleUnderline().run()} aria-label={t("admin.richText.underline")}><UnderlineIcon className="size-3.5" /></button>
      <button type="button" disabled={disabled} className={`${btn} ${editor.isActive("heading", { level: 2 }) ? on : ""}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label={t("admin.richText.heading")}><Heading2 className="size-3.5" /></button>
      <button type="button" disabled={disabled} className={`${btn} ${editor.isActive("bulletList") ? on : ""}`} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label={t("admin.richText.bulletList")}><List className="size-3.5" /></button>
      <button type="button" disabled={disabled} className={`${btn} ${editor.isActive("orderedList") ? on : ""}`} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label={t("admin.richText.orderedList")}><ListOrdered className="size-3.5" /></button>
      <button type="button" disabled={disabled} className={`${btn} ${editor.isActive("link") ? on : ""}`} onClick={setLink} aria-label={t("admin.richText.link")}><Link2 className="size-3.5" /></button>
      {onImageUpload ? (
        <button type="button" disabled={disabled} className={btn} onClick={pickImage} aria-label={t("admin.richText.image")}><ImageIcon className="size-3.5" /></button>
      ) : null}
    </div>
  );
}
