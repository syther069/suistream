import Link from "next/link";
import {
  Bot,
  CloudUpload,
  Database,
  HandCoins,
  ShieldCheck,
  Waypoints
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";

const stats = [
  { value: "Mainnet", label: "Sui Network", icon: Waypoints },
  { value: "Walrus", label: "Storage Layer", icon: Database },
  { value: "Tatum", label: "RPC Provider", icon: ShieldCheck },
  { value: "OpenAI", label: "Moderation", icon: Bot }
];

const features = [
  {
    title: "Upload to Walrus",
    body: "Store media and metadata. 3 epochs. Deletable.",
    icon: CloudUpload
  },
  {
    title: "Verify on Sui",
    body: "Every asset is an on-chain object with hash, creator, and tip events.",
    icon: ShieldCheck
  },
  {
    title: "AI Moderation",
    body: "Generate tags, descriptions, and safety status before storage.",
    icon: Bot
  },
  {
    title: "Direct Tips",
    body: "Send SUI to creators. No platform cut. On-chain record.",
    icon: HandCoins
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white/[0.90]">
      <LandingHeader />

      <section className="mx-auto flex min-h-[calc(100vh-65px)] w-[min(100%-2rem,1200px)] items-center py-20 sm:py-28">
        <div>
          <div className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.05em] text-white/[0.60]">
            <span className="h-1.5 w-1.5 bg-[#6FBCF0]" />
            Network live on Sui mainnet
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.1] tracking-[-0.04em] text-white/[0.90] sm:text-6xl">
            Upload Once.
            <br />
            Own Forever.
          </h1>
          <p className="mt-6 max-w-[480px] text-lg leading-[1.6] text-white/[0.60]">
            Store on Walrus. Verify on Sui. Monetize without middlemen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/upload"
              className="border border-white/[0.08] bg-[#111111] px-5 py-3 text-sm font-medium text-white/[0.90] transition-colors duration-200 hover:border-[#6FBCF0]"
            >
              Upload
            </Link>
            <Link
              href="/feed"
              className="border border-white/[0.08] bg-[#111111] px-5 py-3 text-sm font-medium text-white/[0.90] transition-colors duration-200 hover:border-[#6FBCF0]"
            >
              Explore Feed
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.08]">
        <div className="mx-auto w-[min(100%-2rem,1200px)] py-20">
          <div className="mb-10 max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.05em] text-white/[0.60]">
              How it works
            </p>
            <h2 className="mt-3 text-2xl font-medium text-white/[0.90]">
              A direct path from upload to ownership.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                  className="border border-white/[0.08] bg-[#111111] p-6 transition-colors duration-200 hover:border-white/[0.15]"
              >
                  <Icon className="mb-8 h-6 w-6 stroke-[1.5] text-white/[0.60]" />
                  <h3 className="text-lg font-medium text-white/[0.90]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-[1.6] text-white/[0.60]">
                  {feature.body}
                </p>
              </article>
            );
          })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.08] bg-[#111111]">
        <div className="mx-auto grid w-[min(100%-2rem,1200px)] grid-cols-2 md:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex flex-col items-center border-white/[0.08] px-4 py-10 text-center max-md:border-b max-md:odd:border-r md:border-r md:last:border-r-0"
              >
                <Icon className="mb-4 h-5 w-5 stroke-[1.5] text-white/[0.60]" />
                <div className="text-base font-medium text-white/[0.90]">
                  {item.value}
                </div>
                <div className="mt-2 font-mono text-xs uppercase tracking-[0.05em] text-white/[0.60]">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-[min(100%-2rem,1200px)] py-24">
        <h2 className="text-2xl font-medium text-white/[0.90]">
          Ready to reclaim your content?
        </h2>
        <p className="mt-4 max-w-xl text-base leading-[1.6] text-white/[0.60]">
          Start with an upload. Store the bundle on Walrus.
          <br />
          Mint the content object for the feed.
        </p>
        <Link
          href="/upload"
          className="mt-8 inline-flex border border-white/[0.08] bg-[#111111] px-5 py-3 text-sm font-medium text-white/[0.90] transition-colors duration-200 hover:border-[#6FBCF0]"
        >
          Open Upload Tool
        </Link>
      </section>

      <footer className="border-t border-white/[0.08] py-8">
        <div className="mx-auto grid w-[min(100%-2rem,1200px)] gap-4 font-mono text-xs text-white/[0.60] md:grid-cols-3">
          <span className="font-mono">SuiStream / 2026</span>
          <span className="md:text-center">
            Powered by Walrus, Sui, Tatum, and OpenAI
          </span>
          <span className="md:text-right">Mainnet configuration required</span>
        </div>
      </footer>
    </main>
  );
}
