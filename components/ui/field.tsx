import { Field as FieldPrimitive } from "@base-ui/react/field";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const fieldVariants = cva("group/field flex flex-col gap-2", {
  variants: {
    orientation: {
      vertical: "",
      horizontal: "flex-row items-center justify-between gap-4",
    },
  },
  defaultVariants: { orientation: "vertical" },
});

function Field({
  className,
  orientation,
  ...props
}: FieldPrimitive.Root.Props & VariantProps<typeof fieldVariants>) {
  return (
    <FieldPrimitive.Root
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[invalid]/field:text-destructive",
        className
      )}
      {...props}
    />
  );
}

function FieldDescription({
  className,
  ...props
}: FieldPrimitive.Description.Props) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={cn("text-xs leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}

function FieldError({ className, ...props }: FieldPrimitive.Error.Props) {
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      className={cn("text-xs leading-6 text-destructive", className)}
      {...props}
    />
  );
}

export { Field, FieldDescription, FieldError, FieldLabel };
