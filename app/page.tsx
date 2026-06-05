import Link from "next/link";
import {
  Bot,
  CloudUpload,
  Database,
  HandCoins,
  ShieldCheck,
  Sparkles,
  Verified
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { WalletConnectButton } from "@/components/wallet-connect-button";

const stats = [
  ["Mainnet", "Sui network"],
  ["Walrus", "Storage layer"],
  ["Tatum", "RPC provider"],
  ["AI Moderation", "AI moderation"]
];

const features = [
  {
    title: "Upload to Walrus",
    body: "Store media and metadata through mainnet Walrus publisher endpoints with 3 epochs and deletable storage.",
    icon: CloudUpload,
    wide: true
  },
  {
    title: "Verify on Sui",
    body: "Every approved asset is represented by a Sui content object with hash, creator, and tip events.",
    icon: ShieldCheck
  },
  {
    title: "AI Moderation",
    body: "Generate tags, descriptions, and safety status before storage and minting.",
    icon: Bot
  },
  {
    title: "Creator Economy",
    body: "SUI tips are signed by connected wallets and recorded through mainnet content events.",
    icon: HandCoins,
    wide: true
  }
];

export default function HomePage() {
  return (
    <main>
      <SiteHeader />
      <section className="relative overflow-hidden">
        <div className="technical-grid absolute inset-x-0 top-0 h-[560px] opacity-50" />
        <div className="absolute left-1/2 top-40 h-96 w-[70vw] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="container-grid relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center py-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-outline-soft bg-surface-low px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs uppercase tracking-wider text-on-muted">
              Network live on Sui mainnet
            </span>
          </div>
          <h1 className="max-w-5xl text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-7xl lg:text-8xl">
            Upload Once.
            <br />
            <span className="text-primary">Own Forever.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-on-muted">
            Store media on Walrus, verify ownership on Sui, and monetize content
            through a decentralized creator workflow with AI moderation in the
            middle.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <WalletConnectButton />
            <Button variant="outline" size="lg">
              <Link href="/feed">Explore Feed</Link>
            </Button>
          </div>
          <div className="mt-16 w-full max-w-5xl rounded-lg border border-outline-soft bg-surface-container p-2 shadow-primary-soft">
            <div className="technical-grid relative aspect-[16/8] overflow-hidden rounded-md border border-outline-soft bg-surface-low">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid w-full max-w-3xl grid-cols-1 gap-4 px-6 sm:grid-cols-3">
                  {[
                    { label: "AI", icon: Bot },
                    { label: "Walrus", icon: Database },
                    { label: "Sui", icon: Verified }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="flex aspect-square flex-col items-center justify-center rounded-lg border border-outline-soft bg-surface-container/80"
                      >
                        <Icon className="mb-3 h-8 w-8 text-primary" />
                        <span className="font-mono text-xs uppercase text-on-muted">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-grid border-t border-outline-soft py-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className={`group relative overflow-hidden rounded-lg border border-outline-soft bg-surface-container p-6 transition-colors hover:border-primary/50 ${
                  feature.wide ? "md:col-span-8" : "md:col-span-4"
                }`}
              >
                <Icon className="mb-5 h-8 w-8 text-primary" />
                <h3 className="text-2xl font-semibold">{feature.title}</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-on-muted">
                  {feature.body}
                </p>
                <div className="absolute -bottom-10 -right-8 text-[120px] font-black text-white/[0.02]">
                  {feature.title.slice(0, 2)}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-outline-soft bg-surface-low py-14">
        <div className="container-grid grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map(([value, label]) => (
            <div key={label} className="text-center">
              <div className="text-4xl font-bold text-primary">{value}</div>
              <div className="mt-2 font-mono text-xs uppercase tracking-wider text-on-muted">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-grid py-20 text-center">
        <h2 className="text-4xl font-bold">Ready to reclaim your content?</h2>
        <p className="mx-auto mt-4 max-w-xl text-on-muted">
          Start with an upload, see AI tags, store the bundle on Walrus, and
          mint the content object for the feed.
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg">
            <Link href="/upload">Open Upload Tool</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-outline-soft py-8">
        <div className="container-grid flex flex-col justify-between gap-4 text-sm text-on-muted md:flex-row">
          <span className="font-mono">SuiStream / 2026</span>
          <span>Powered by Walrus, Sui, Tatum, and AI</span>
          <span className="font-mono">Mainnet configuration required</span>
        </div>
      </footer>
    </main>
  );
}
