"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Link2,
} from "lucide-react";
import { useTranslations } from "@/lib/i18n";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeightClass?: string;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled,
  minHeightClass = "min-h-28",
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
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class: `rich-text-editor prose prose-sm max-w-none px-3 py-2 outline-none ${minHeightClass}`,
      },
    },
  });

  if (!editor) return null;

  return (
    <div className={`overflow-hidden rounded-lg bg-[#f2f2f2] ${disabled ? "opacity-60" : ""}`}>
      <Toolbar editor={editor} disabled={Boolean(disabled)} t={t} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({
  editor,
  disabled,
  t,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>;
  disabled: boolean;
  t: ReturnType<typeof useTranslations>;
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
    </div>
  );
}

