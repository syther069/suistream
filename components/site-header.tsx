"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutDashboard, Search, UploadCloud } from "lucide-react";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/feed", label: "Explore", icon: Compass },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
];

export function SiteHeader({ search = false }: { search?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-outline-soft bg-surface/85 backdrop-blur-md">
        <div className="container-grid flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold tracking-tight text-primary">
              SuiStream
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              {navItems.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "border-b-2 pb-1 text-sm font-semibold transition-colors",
                      active
                        ? "border-primary text-primary"
                        : "border-transparent text-on-muted hover:text-primary"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end gap-3">
            {search ? (
              <label className="relative hidden w-full max-w-sm sm:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-muted" />
                <input
                  className="focus-ring h-10 w-full rounded-lg border border-outline-soft bg-surface-low pl-9 pr-3 text-sm text-on-surface placeholder:text-on-muted/60 focus:border-primary"
                  placeholder="Search creators, tags, or streams..."
                />
              </label>
            ) : null}
            <WalletConnectButton compact />
          </div>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-outline-soft bg-surface/95 backdrop-blur-md md:hidden">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-[10px]",
                active ? "text-primary" : "text-on-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
