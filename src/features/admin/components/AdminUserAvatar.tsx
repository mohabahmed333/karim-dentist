import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: { box: "size-6", text: "text-[9px]", px: 24 },
  sm: { box: "size-7", text: "text-[10px]", px: 28 },
  md: { box: "size-9", text: "text-xs", px: 36 },
  lg: { box: "size-12", text: "text-base", px: 48 },
  xl: { box: "size-20", text: "text-xl", px: 80 },
} as const;

type Props = {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
};

/** First letters of the name, else the email's first letter, else "?". */
export function avatarInitials(
  name?: string | null,
  email?: string | null,
): string {
  const source = name?.trim() || email?.trim() || "";
  if (!source) return "?";
  const words = source.split(/[\s._-]+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word[0] ?? "");
  return (letters.join("") || source[0] || "?").toUpperCase();
}

/** Photo when there is one, initials on the brand colour otherwise. */
export function AdminUserAvatar({
  name,
  email,
  avatarUrl,
  size = "md",
  className,
}: Props) {
  const { box, text, px } = SIZES[size];

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={px}
        height={px}
        className={cn(box, "shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        box,
        text,
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        className,
      )}
      style={{ background: "var(--admin-primary, #5e6ad2)" }}
    >
      {avatarInitials(name, email)}
    </span>
  );
}
