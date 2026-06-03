import { Badge } from "@/components/ui/badge";

export function TagList({ tags, dense = false }: { tags: string[]; dense?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag} className={dense ? "px-1.5 py-0.5 text-[10px]" : ""}>
          #{tag}
        </Badge>
      ))}
    </div>
  );
}
