"use client";

import { ConnectButton } from "@mysten/dapp-kit";

export function WalletConnectButton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "[&_*]:text-xs" : ""}>
      <ConnectButton connectText="Connect Wallet" />
    </div>
  );
}
