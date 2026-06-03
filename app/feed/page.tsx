import { categories, mediaItems } from "@/lib/sample-data";
import { FeedGrid } from "@/components/feed-grid";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function FeedPage() {
  return (
    <main className="pb-24 md:pb-0">
      <SiteHeader search />
      <section className="container-grid py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Explore</h1>
            <p className="mt-2 text-on-muted">
              Approved content from Walrus storage and Sui provenance events.
            </p>
          </div>
          <div className="font-mono text-xs uppercase tracking-wider text-primary">
            {mediaItems.length} demo streams
          </div>
        </div>
        <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
          {categories.map((category, index) => (
            <Button
              key={category}
              variant={index === 0 ? "primary" : "secondary"}
              size="sm"
              className="shrink-0"
            >
              {category}
            </Button>
          ))}
        </div>
        <FeedGrid items={mediaItems} />
        <div className="mt-10 flex justify-center">
          <Button variant="outline" size="lg">
            Load More Content
          </Button>
        </div>
      </section>
    </main>
  );
}
