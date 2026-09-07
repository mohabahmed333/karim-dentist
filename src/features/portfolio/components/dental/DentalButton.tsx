import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const dentalButtonVariants = cva(
  "inline-flex w-fit items-center justify-center gap-[0.55rem] rounded-full border border-transparent font-bold transition-[transform,background] duration-200",
  {
    variants: {
      variant: {
        primary:
          "min-h-[52px] bg-[#111111] px-[1.45rem] py-[0.85rem] text-sm text-white hover:bg-[#0f2744]",
        secondary:
          "min-h-[52px] border-[#e6e8ec] bg-white px-[1.45rem] py-[0.85rem] text-sm text-[#0f2744] hover:border-[#0f2744]",
        ghost:
          "min-h-[52px] border-[#e6e8ec] bg-transparent px-[1.45rem] py-[0.85rem] text-sm text-[#0f2744] hover:border-[#0f2744]",
      },
      size: {
        default: "",
        sm: "min-h-10 px-4 py-2 text-xs",
        icon: "h-[46px] w-[46px] min-h-0 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type DentalButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof dentalButtonVariants> & {
    asChild?: boolean;
    href?: string;
  };

export function DentalButton({
  className,
  variant,
  size,
  href,
  children,
  ...props
}: DentalButtonProps) {
  const classes = cn(dentalButtonVariants({ variant, size }), className);

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
