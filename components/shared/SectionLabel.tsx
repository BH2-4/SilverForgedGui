import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "div";
}

export function SectionLabel({
  children,
  className,
  as = "span",
}: SectionLabelProps) {
  const Component = as;
  return (
    <Component className={cn("eyebrow inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="inline-block h-px w-6 bg-[var(--color-line-strong)]"
      />
      {children}
    </Component>
  );
}
