"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Compass,
  Database,
  ExternalLink,
  HandCoins,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  Video
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { getSuiExplorerObjectUrl, getSuiExplorerTransactionUrl } from "@/lib/config";
import type { DashboardData, OwnedContent } from "@/lib/types";
import { cn, shortenAddress } from "@/lib/utils";

function formatMist(value: string) {
  const mist = BigInt(value);
  const whole = mist / 1_000_000_000n;
  const fraction = mist % 1_000_000_000n;
  const fractionText = fraction.toString().padStart(9, "0").slice(0, 2);
  return `${whole.toLocaleString()}.${fractionText} SUI`;
}

function formatBytes(value: number) {
  if (value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(value) / Math.log(1024))
  );
  const amount = value / 1024 ** index;
  return `${amount.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatTipTime(timestampMs: string | null) {
  if (!timestampMs) {
    return "Time unavailable";
  }

  const timestamp = Number(timestampMs);
  if (!Number.isFinite(timestamp)) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function SkeletonBlock({
  className,
  style
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg border border-outline-soft bg-surface-high",
        className
      )}
      style={style}
    />
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-outline-soft bg-surface-low p-6 text-center text-sm text-on-muted">
      {message}
    </div>
  );
}

function isDashboardData(value: DashboardData | { error?: string }): value is DashboardData {
  return "totalEarningsMist" in value && "ownedContent" in value;
}

function ContentTile({ content }: { content: OwnedContent }) {
  return (
    <a
      href={getSuiExplorerObjectUrl(content.suiObjectId)}
      target="_blank"
      rel="noreferrer"
      className="group relative aspect-video overflow-hidden rounded-lg border border-outline-soft bg-surface-high"
    >
      <img
        src={content.imageUrl}
        alt={content.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 to-transparent p-4">
        <p className="truncate text-sm font-semibold">{content.title}</p>
        <div className="mt-1 flex items-center justify-between gap-3 font-mono text-[10px] text-primary">
          <span>{formatBytes(content.storageBytes)}</span>
          <span>{shortenAddress(content.suiObjectId, 6, 3)}</span>
        </div>
      </div>
    </a>
  );
}

export default function DashboardPage() {
  const account = useCurrentAccount();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("suistream.sidebarCollapsed");
    if (stored) {
      setSidebarCollapsed(stored === "true");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "suistream.sidebarCollapsed",
      String(sidebarCollapsed)
    );
  }, [sidebarCollapsed]);

  useEffect(() => {
    const address = account?.address;

    if (!address) {
      setData(null);
      return;
    }

    const walletAddress = address;
    const controller = new AbortController();
    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/dashboard?address=${encodeURIComponent(walletAddress)}`,
          { signal: controller.signal }
        );
        const payload = (await response.json()) as DashboardData | { error?: string };

        if (!response.ok || !isDashboardData(payload)) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "Unable to load dashboard data."
          );
        }

        setData(payload);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load dashboard data."
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      controller.abort();
    };
  }, [account?.address]);

  const maxRevenue = useMemo(() => {
    return data?.revenue.reduce((max, point) => {
      const amount = BigInt(point.amountMist);
      return amount > max ? amount : max;
    }, 0n);
  }, [data?.revenue]);

  const shellOffset = sidebarCollapsed ? "lg:ml-20" : "lg:ml-64";

  return (
    <main className="min-h-screen bg-surface">
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-outline-soft bg-surface-container px-4 py-6 transition-[width] duration-300 lg:flex",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="mb-10 flex items-center justify-between gap-3 px-2">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
              <Database className="h-4 w-4" />
            </div>
            {!sidebarCollapsed ? (
              <span className="truncate text-xl font-semibold text-primary">
                SuiStream
              </span>
            ) : null}
          </Link>
          <button
            className="focus-ring rounded-lg border border-outline-soft bg-surface-high p-2 text-on-muted hover:text-primary"
            onClick={() => setSidebarCollapsed((value) => !value)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { href: "/feed", label: "Explore", icon: Compass },
            { href: "/upload", label: "Upload", icon: CloudUpload },
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-3 text-on-muted hover:bg-surface-high hover:text-primary",
                  item.href === "/dashboard" &&
                    "bg-surface-high font-semibold text-primary",
                  sidebarCollapsed && "justify-center"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed ? item.label : null}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-lg border border-outline-soft bg-surface-low p-3">
          {!sidebarCollapsed ? (
            <>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-on-muted">Walrus Storage</span>
                <span className="font-mono text-primary">
                  {data ? `${data.storagePercent.toFixed(1)}%` : "0%"}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-surface-high">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${data?.storagePercent ?? 0}%` }}
                />
              </div>
            </>
          ) : (
            <Database className="mx-auto h-5 w-5 text-primary" />
          )}
        </div>

        <div className="mt-4 border-t border-outline-soft pt-4">
          <WalletConnectButton compact={sidebarCollapsed} />
        </div>
      </aside>

      <section
        className={cn(
          "container-grid py-8 transition-[margin,width] duration-300",
          shellOffset
        )}
      >
        <header className="mb-8 flex flex-col justify-between gap-4 border-b border-outline-soft pb-6 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Creator Dashboard
            </h1>
            <p className="mt-2 text-on-muted">
              Real mainnet content, tips, and storage for the connected wallet.
            </p>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="text-right">
              <p className="font-mono text-xs uppercase text-on-muted">
                Total earnings
              </p>
              <p className="text-xl font-semibold text-primary">
                {data ? formatMist(data.totalEarningsMist) : "0.00 SUI"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs uppercase text-on-muted">
                Storage used
              </p>
              <p className="text-xl font-semibold">
                {data ? formatBytes(data.storageUsedBytes) : "0 B"}
              </p>
            </div>
          </div>
        </header>

        {!account ? (
          <Card>
            <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
              <WalletConnectButton />
              <p className="text-sm text-on-muted">
                Connect a Sui mainnet wallet to load dashboard data.
              </p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex min-h-64 items-center justify-center text-center text-sm text-danger">
              {error}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <Card className="xl:col-span-8">
              <CardContent className="flex h-[380px] flex-col">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Revenue Overview
                  </h2>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : null}
                </div>
                {loading ? (
                  <div className="flex flex-1 items-end justify-between gap-2">
                    {Array.from({ length: 7 }, (_, index) => (
                      <SkeletonBlock
                        key={index}
                        className="w-full"
                        style={{ height: `${32 + index * 7}%` }}
                      />
                    ))}
                  </div>
                ) : data && maxRevenue && maxRevenue > 0n ? (
                  <>
                    <div className="flex flex-1 items-end justify-between gap-2 px-2">
                      {data.revenue.map((point) => {
                        const amount = BigInt(point.amountMist);
                        const height =
                          maxRevenue > 0n
                            ? Number((amount * 100n) / maxRevenue)
                            : 0;
                        return (
                          <div
                            key={point.label}
                            className="w-full rounded-t border-t-2 border-primary bg-primary/20"
                            style={{ height: `${Math.max(4, height)}%` }}
                            title={formatMist(point.amountMist)}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-4 flex justify-between font-mono text-[10px] text-on-muted">
                      {data.revenue.map((point) => (
                        <span key={point.label}>{point.label}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState message="No earnings yet" />
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-4">
              <CardContent>
                <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold">
                  <HandCoins className="h-5 w-5 text-primary" />
                  Recent Tips
                </h2>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }, (_, index) => (
                      <SkeletonBlock key={index} className="h-16" />
                    ))}
                  </div>
                ) : data?.recentTips.length ? (
                  <div className="space-y-3">
                    {data.recentTips.map((tip) => (
                      <a
                        key={tip.digest}
                        href={getSuiExplorerTransactionUrl(tip.digest)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg border border-outline-soft bg-surface-low p-3 hover:border-primary/50"
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {shortenAddress(tip.digest, 8, 6)}
                          </p>
                          <p className="text-xs text-on-muted">
                            {formatTipTime(tip.timestampMs)}
                          </p>
                        </div>
                        <span className="font-mono text-sm font-semibold text-primary">
                          {formatMist(tip.amountMist)}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No tips received yet" />
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-8">
              <CardContent>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <Video className="h-5 w-5 text-primary" />
                    Content Library
                  </h2>
                  <Link href="/upload" className="text-sm text-primary">
                    Upload
                  </Link>
                </div>
                {loading ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Array.from({ length: 4 }, (_, index) => (
                      <SkeletonBlock key={index} className="aspect-video" />
                    ))}
                  </div>
                ) : data?.ownedContent.length ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {data.ownedContent.map((content) => (
                      <ContentTile key={content.suiObjectId} content={content} />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="You haven't uploaded any content yet. Upload your first piece!" />
                )}
              </CardContent>
            </Card>

            <div className="space-y-6 xl:col-span-4">
              <Card>
                <CardContent>
                  <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Mainnet Objects
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-lg border border-outline-soft bg-surface-low p-3">
                      <span className="text-on-muted">Owned content</span>
                      <span className="font-mono text-primary">
                        {data?.ownedContent.length ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-outline-soft bg-surface-low p-3">
                      <span className="text-on-muted">Tip events</span>
                      <span className="font-mono text-primary">
                        {data?.recentTips.length ?? 0}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`https://suiexplorer.com/address/${account.address}?network=mainnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-outline-soft px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-high"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Wallet
                  </a>
                </CardContent>
              </Card>

              <div className="relative overflow-hidden rounded-lg border border-primary/30 bg-primary/10 p-5">
                <h2 className="text-xl font-semibold text-primary">
                  Walrus Storage
                </h2>
                <p className="mt-1 text-sm text-on-muted">
                  Calculated from Walrus blob sizes recorded in owned metadata.
                </p>
                <div className="mt-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-on-primary">
                    <Database className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-mono">
                      {data
                        ? `${formatBytes(data.storageUsedBytes)} / ${formatBytes(
                            data.storageQuotaBytes
                          )}`
                        : "0 B / 0 B"}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded bg-surface-high">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${data?.storagePercent ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
