import Link from "next/link";
import { Bookmark, ExternalLink, Share2 } from "lucide-react";
import { ProvenanceBadge } from "@/components/provenance-badge";
import { SiteHeader } from "@/components/site-header";
import { TagList } from "@/components/tag-list";
import { TipModal } from "@/components/TipModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getContentById, mediaItems } from "@/lib/sample-data";
import { formatDate, shortenAddress } from "@/lib/utils";

export default async function ContentDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const content = getContentById(id);
  const related = mediaItems.filter((item) => item.id !== content.id).slice(0, 4);

  return (
    <main className="pb-24 md:pb-0">
      <SiteHeader search />
      <section className="container-grid grid grid-cols-1 gap-8 py-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="relative aspect-video overflow-hidden rounded-lg border border-outline-soft bg-surface-low">
            <img
              src={content.imageUrl}
              alt={content.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-6">
              <div className="mb-2 font-mono text-xs text-primary">
                Streaming via Walrus Protocol / 4K preview
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold">{content.title}</h1>
                {content.isDemo ? <Badge tone="warning">Demo</Badge> : null}
              </div>
            </div>
          </div>

          <Card className="glass-panel">
            <CardContent className="space-y-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-semibold">{content.creator}</h2>
                  <p className="mt-1 text-sm text-on-muted">
                    {shortenAddress(content.creatorAddress)} /{" "}
                    {formatDate(content.createdAt)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary">Follow</Button>
                  <TipModal
                    creator={content.creator}
                    creatorAddress={content.creatorAddress}
                    contentObjectId={content.isDemo ? undefined : content.suiObjectId}
                    disabled={content.isDemo}
                    disabledReason="Tipping not available on demo content"
                  />
                </div>
              </div>
              <p className="max-w-3xl border-t border-outline-soft pt-5 leading-7 text-on-muted">
                {content.description}
              </p>
              <TagList tags={content.tags} />
            </CardContent>
          </Card>

          <div className="flex items-center gap-6 px-2">
            <button className="focus-ring flex items-center gap-2 rounded text-on-muted hover:text-primary">
              <Share2 className="h-4 w-4" />
              <span className="font-mono text-xs">Share</span>
            </button>
            <button className="focus-ring ml-auto flex items-center gap-2 rounded text-on-muted hover:text-primary">
              <Bookmark className="h-4 w-4" />
              <span className="font-mono text-xs">Save</span>
            </button>
          </div>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <ProvenanceBadge content={content} />
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-xl font-semibold">Collect Asset</h3>
              <p className="text-sm text-on-muted">
                Own a verified license to stream and showcase this content in
                your personal gallery.
              </p>
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
                <div className="text-xs font-semibold uppercase text-primary">
                  Content status
                </div>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <span className="text-2xl font-semibold">
                    {content.isDemo ? "Demo only" : "Mainnet"}
                  </span>
                  <Button size="sm" disabled={content.isDemo}>
                    Collect
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-on-muted">
                <ExternalLink className="h-3.5 w-3.5" />
                Secured by Sui smart contracts
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>

      <section className="container-grid pb-16">
        <h2 className="mb-5 text-2xl font-semibold">
          More from verified creators
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((item) => (
            <Link
              key={item.id}
              href={`/content/${item.id}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-outline-soft bg-surface-container"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background/90 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-xs text-on-muted">Demo content</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
