"use client";

import { useState } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction
} from "@mysten/dapp-kit";
import { ExternalLink, HandCoins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSuiExplorerTransactionUrl } from "@/lib/config";
import { buildTipContentTransaction } from "@/lib/sui-transactions";
import { formatSui } from "@/lib/utils";

const DEFAULT_TIP_MIST = 1_000_000_000n;

export function TipButton({
  creator,
  contentObjectId,
  compact = false,
  disabled = false,
  disabledReason = "Tipping not available on demo content"
}: {
  creator: string;
  contentObjectId?: string;
  compact?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const account = useCurrentAccount();
  const signAndExecute = useSignAndExecuteTransaction();
  const [digest, setDigest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendTip() {
    setError(null);

    if (!account) {
      setError("Connect a Sui mainnet wallet before tipping.");
      return;
    }

    if (!contentObjectId) {
      setError("A Sui content object is required before tipping.");
      return;
    }

    try {
      const transaction = buildTipContentTransaction({
        contentObjectId,
        amountMist: DEFAULT_TIP_MIST
      });
      const result = await signAndExecute.mutateAsync({
        transaction,
        chain: "sui:mainnet"
      });

      setDigest(result.digest);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tip transaction failed.");
    }
  }

  if (disabled) {
    return (
      <Button
        size={compact ? "sm" : "md"}
        disabled
        title={disabledReason}
        aria-label={disabledReason}
      >
        <HandCoins className="h-4 w-4" />
        {compact ? "Tip" : "Tip Creator"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        size={compact ? "sm" : "md"}
        onClick={sendTip}
        title={`Tip ${creator}`}
        disabled={signAndExecute.isPending}
      >
        {signAndExecute.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <HandCoins className="h-4 w-4" />
        )}
        {digest ? `Sent ${formatSui(1)}` : compact ? "Tip" : "Tip Creator"}
      </Button>
      {digest ? (
        <a
          href={getSuiExplorerTransactionUrl(digest)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          View digest
        </a>
      ) : null}
      {error ? <p className="max-w-48 text-right text-xs text-danger">{error}</p> : null}
    </div>
  );
}
