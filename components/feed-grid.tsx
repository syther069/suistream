import { MediaCard } from "@/components/media-card";
import type { MediaContent } from "@/lib/types";

export function FeedGrid({ items }: { items: MediaContent[] }) {
  return (
    <div className="masonry-grid">
      {items.map((item) => (
        <MediaCard key={item.id} item={item} />
      ))}
    </div>
  );
}
