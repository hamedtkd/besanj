import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/** Based on PersianLabs/ui Button; styling tuned to Besanj/Poolamkoo. */
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 touch-manipulation items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        outline:
          "border-border bg-background/70 hover:bg-muted hover:text-foreground dark:bg-input/20 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-4",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
        lg: "h-11 gap-2 px-5",
        icon: "size-10",
        "icon-sm": "size-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading ? "" : undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && <Spinner data-icon="inline-start" />}
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
