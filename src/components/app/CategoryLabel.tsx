import { CATEGORY_LABELS, type MistakeCategory } from "@/lib/feedback-schema";

export function CategoryLabel({ category }: { category: MistakeCategory }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-secondary px-2 py-0.5 text-[0.7rem] font-medium text-secondary-foreground">
      {CATEGORY_LABELS[category]}
    </span>
  );
}
