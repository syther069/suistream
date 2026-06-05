"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Check, Copy, LogOut } from "lucide-react";
import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { shortenAddress } from "@/lib/utils";

const navItems = [
  { href: "/feed", label: "Explore" },
  { href: "/upload", label: "Upload" },
  { href: "/dashboard", label: "Dashboard" }
];

export function LandingHeader() {
  const account = useCurrentAccount();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    if (!account?.address) {
      return;
    }

    await navigator.clipboard.writeText(account.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <header className="border-b border-white/[0.08] bg-[#0a0a0a]">
      <div className="mx-auto flex min-h-16 w-[min(100%-2rem,1200px)] flex-wrap items-center justify-between gap-x-8 gap-y-3 py-3">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-base font-semibold text-white/[0.90] transition-colors duration-200 hover:text-[#6FBCF0]"
          >
            SuiStream
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-white/[0.60] transition-colors duration-200 hover:text-white/[0.90]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {account ? (
          <details className="relative">
            <summary
              onClick={() => void copyAddress()}
              className="flex cursor-pointer list-none items-center gap-2 border border-white/[0.08] bg-[#111111] px-3 py-2 font-mono text-xs text-white/[0.90] transition-colors duration-200 hover:border-[#6FBCF0] [&::-webkit-details-marker]:hidden"
            >
              {shortenAddress(account.address, 6, 4)}
              <ChevronDown className="h-3.5 w-3.5 text-white/[0.60]" />
            </summary>
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 border border-white/[0.08] bg-[#111111] p-1 font-mono text-xs text-white/[0.90]">
              <button
                type="button"
                onClick={copyAddress}
                className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors duration-200 hover:bg-[#0a0a0a]"
              >
                <span>{copied ? "Address copied" : "Copy address"}</span>
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-[#6FBCF0]" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-white/[0.60]" />
                )}
              </button>
              <div className="flex items-center justify-between border-y border-white/[0.08] px-3 py-2 text-white/[0.60]">
                <span>Network</span>
                <span className="text-white/[0.90]">Sui Mainnet</span>
              </div>
              <button
                type="button"
                onClick={() => disconnectWallet()}
                className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors duration-200 hover:bg-[#0a0a0a]"
              >
                <span>Disconnect</span>
                <LogOut className="h-3.5 w-3.5 text-white/[0.60]" />
              </button>
            </div>
          </details>
        ) : (
          <div className="landing-wallet">
            <WalletConnectButton compact />
          </div>
        )}

        <nav className="order-3 flex w-full items-center justify-between border-t border-white/[0.08] pt-3 sm:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-white/[0.60] transition-colors duration-200 hover:text-white/[0.90]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
