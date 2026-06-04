"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { CheckCircle2, ExternalLink, HandCoins, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSuiExplorerTransactionUrl } from "@/lib/config";
import { cn, shortenAddress } from "@/lib/utils";

type TokenSymbol = "SUI" | "USDC";

type TokenOption = {
  symbol: TokenSymbol;
  coinType: string;
  decimals: number;
  pythPriceId?: string;
};

type CoinBalance = {
  coinObjectId: string;
  balance: string;
};

const TOKENS: TokenOption[] = [
  {
    symbol: "SUI",
    coinType: "0x2::sui::SUI",
    decimals: 9,
    pythPriceId:
      "0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744"
  },
  {
    symbol: "USDC",
    coinType:
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    decimals: 6
  }
];

const MIN_USD = 0.1;
const MAX_USD = 100;

function parsePythPrice(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Price feed returned an invalid response.");
  }

  const parsed = (payload as { parsed?: unknown }).parsed;
  const first = Array.isArray(parsed) ? parsed[0] : null;
  const priceInfo =
    first && typeof first === "object"
      ? (first as { price?: { price?: string; expo?: number } }).price
      : null;

  if (!priceInfo?.price || typeof priceInfo.expo !== "number") {
    throw new Error("Price feed did not include a usable price.");
  }

  const price = Number(priceInfo.price) * 10 ** priceInfo.expo;
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Price feed returned a non-positive price.");
  }

  return price;
}

function formatTokenAmount(value: number) {
  if (!Number.isFinite(value)) return "0";

  return value.toLocaleString(undefined, {
    maximumFractionDigits: value < 1 ? 6 : 4
  });
}

function smallestUnitsFromTokenAmount(tokenAmount: number, decimals: number) {
  if (!Number.isFinite(tokenAmount) || tokenAmount <= 0) {
    throw new Error("Enter a valid amount.");
  }

  return BigInt(Math.ceil(tokenAmount * 10 ** decimals));
}

/**
 * Build a direct SUI transfer: split from gas coin, transfer to creator.
 * No contract interaction — just a plain coin transfer.
 */
function buildSuiTransferTransaction(input: {
  creatorAddress: string;
  amount: bigint;
}) {
  const tx = new Transaction();

  // Split the exact tip amount from the gas coin
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(input.amount)]);

  // Transfer directly to the creator's wallet address
  tx.transferObjects([coin], tx.pure.address(input.creatorAddress));

  return tx;
}

/**
 * Build a WAL/USDC transfer: fetch sender's coins of that type,
 * merge if needed, split the exact amount, transfer to creator.
 */
function buildTokenTransferTransaction(input: {
  creatorAddress: string;
  amount: bigint;
  coins: CoinBalance[];
}) {
  const tx = new Transaction();
  const [primary, ...rest] = input.coins;

  if (!primary) {
    throw new Error("No spendable token coin found.");
  }

  const primaryCoin = tx.object(primary.coinObjectId);

  // Merge all other coins into the primary one
  if (rest.length) {
    tx.mergeCoins(
      primaryCoin,
      rest.map((coin) => tx.object(coin.coinObjectId))
    );
  }

  const total = input.coins.reduce(
    (sum, coin) => sum + BigInt(coin.balance),
    0n
  );

  // If the total exactly equals the amount, transfer the whole coin
  if (total === input.amount) {
    tx.transferObjects([primaryCoin], tx.pure.address(input.creatorAddress));
    return tx;
  }

  // Otherwise split the exact amount and transfer the split coin
  const [splitCoin] = tx.splitCoins(primaryCoin, [tx.pure.u64(input.amount)]);
  tx.transferObjects([splitCoin], tx.pure.address(input.creatorAddress));

  return tx;
}

/**
 * Fetch enough coins of the given type owned by the sender to cover `amount`.
 * Throws if insufficient balance.
 */
async function getSpendableCoins(input: {
  owner: string;
  coinType: string;
  amount: bigint;
  suiClient: ReturnType<typeof useSuiClient>;
}) {
  const coins: CoinBalance[] = [];
  let cursor: string | null | undefined;

  do {
    const page = await input.suiClient.getCoins({
      owner: input.owner,
      coinType: input.coinType,
      cursor,
      limit: 50
    });

    coins.push(...page.data);
    cursor = page.hasNextPage ? page.nextCursor : null;
  } while (cursor);

  let total = 0n;
  const selected: CoinBalance[] = [];

  for (const coin of coins) {
    selected.push(coin);
    total += BigInt(coin.balance);

    if (total >= input.amount) {
      return selected;
    }
  }

  const tokenName = input.coinType.split("::").at(-1) ?? "token";
  throw new Error(`Insufficient ${tokenName} balance.`);
}

export function TipModal({
  creator,
  creatorAddress,
  contentObjectId,
  compact = false,
  disabled = false,
  disabledReason = "Tipping not available on demo content"
}: {
  creator: string;
  creatorAddress: string;
  contentObjectId?: string;
  compact?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const signAndExecute = useSignAndExecuteTransaction();
  const [open, setOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>("SUI");
  const [amountUsd, setAmountUsd] = useState("1.00");
  const [prices, setPrices] = useState<Partial<Record<TokenSymbol, number>>>({
    USDC: 1
  });
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    digest: string;
    label: string;
  } | null>(null);

  // Keep contentObjectId referenced so ESLint doesn't flag it as unused
  // (it's passed in but we no longer need it for the direct-transfer approach)
  void contentObjectId;

  const token = useMemo(
    () => TOKENS.find((option) => option.symbol === selectedToken) ?? TOKENS[0],
    [selectedToken]
  );
  const numericUsd = Number(amountUsd);
  const selectedPrice = prices[selectedToken];
  const tokenAmount =
    selectedPrice && Number.isFinite(numericUsd) ? numericUsd / selectedPrice : 0;
  const processing = signAndExecute.isPending;
  const validationError = useMemo(() => {
    if (!selectedToken) return "Select a token.";
    if (!Number.isFinite(numericUsd)) return "Enter an amount.";
    if (numericUsd < MIN_USD) return "Minimum tip is $0.10.";
    if (numericUsd > MAX_USD) return "Maximum tip is $100.00.";
    if (!account) return "Connect a wallet to send a tip.";
    if (!selectedPrice) return "Waiting for token price.";

    return null;
  }, [account, numericUsd, selectedPrice, selectedToken]);

  const loadPrice = useCallback(async (nextToken: TokenOption) => {
    if (nextToken.symbol === "USDC") {
      // USDC is pegged 1:1 USD
      setPrices((current) => ({ ...current, USDC: 1 }));
      setPriceError(null);
      return;
    }

    // For SUI use Pyth price
    setPriceLoading(true);
    setPriceError(null);
    try {
      const response = await fetch(
        `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${nextToken.pythPriceId}`
      );
      if (!response.ok) {
        throw new Error(`Price request failed with ${response.status}.`);
      }
      const payload: unknown = await response.json();
      const price = parsePythPrice(payload);
      setPrices((current) => ({ ...current, [nextToken.symbol]: price }));
    } catch (caught) {
      setPriceError(
        caught instanceof Error ? caught.message : "Unable to fetch token price."
      );
    } finally {
      setPriceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    void loadPrice(token);
  }, [loadPrice, open, token]);

  async function sendTip() {
    setError(null);
    setSuccess(null);

    if (validationError) {
      setError(validationError);
      return;
    }

    // Validate creator address from on-chain data
    if (!creatorAddress || !creatorAddress.startsWith("0x")) {
      setError("Creator address not found. Cannot process tip.");
      return;
    }

    if (!account?.address) {
      setError("Connect a wallet before sending a tip.");
      return;
    }

    const senderAddress = account.address;

    // Log addresses for debugging — these must always be different
    // when User B tips User A
    console.log("Sending tip to creator:", creatorAddress);
    console.log("Tipper wallet:", senderAddress);

    try {
      const amount = smallestUnitsFromTokenAmount(tokenAmount, token.decimals);

      let transaction: Transaction;

      if (token.symbol === "SUI") {
        // SUI: split from gas coin and transfer directly to creator
        transaction = buildSuiTransferTransaction({
          creatorAddress,
          amount
        });
      } else {
        // USDC: fetch coins, merge, split, transfer to creator
        const coins = await getSpendableCoins({
          owner: senderAddress,
          coinType: token.coinType,
          amount,
          suiClient
        });

        transaction = buildTokenTransferTransaction({
          creatorAddress,
          amount,
          coins
        });
      }

      const result = await signAndExecute.mutateAsync({
        transaction,
        chain: "sui:mainnet"
      });

      setSuccess({
        digest: result.digest,
        label: `Sent ${formatTokenAmount(tokenAmount)} ${token.symbol}`
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tip transaction failed.");
    }
  }

  return (
    <>
      <Button
        size={compact ? "sm" : "md"}
        onClick={() => setOpen(true)}
        title={disabled ? disabledReason : `Tip ${creator}`}
        aria-label={disabled ? disabledReason : `Tip ${creator}`}
        disabled={disabled}
      >
        <HandCoins className="h-4 w-4" />
        {compact ? "Tip" : "Tip Creator"}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tip-modal-title"
        >
          <div className="w-full max-w-lg rounded-lg border border-outline-soft bg-surface-container shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-outline-soft p-5">
              <div>
                <h2 id="tip-modal-title" className="text-xl font-semibold">
                  Tip Creator
                </h2>
                <p className="mt-1 text-sm text-on-muted">
                  {creator} / {shortenAddress(creatorAddress)}
                </p>
              </div>
              <button
                type="button"
                className="focus-ring rounded p-1.5 text-on-muted hover:bg-surface-high hover:text-on-surface"
                onClick={() => setOpen(false)}
                disabled={processing}
                aria-label="Close tip modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <div className="mb-2 text-sm font-semibold">Token</div>
                <div className="grid grid-cols-2 gap-3">
                  {TOKENS.map((option) => {
                    const selected = option.symbol === selectedToken;

                    return (
                      <button
                        key={option.symbol}
                        type="button"
                        disabled={processing}
                        onClick={() => {
                          setSelectedToken(option.symbol);
                          setError(null);
                          setSuccess(null);
                        }}
                        className={cn(
                          "focus-ring rounded-lg border p-3 text-left transition-colors disabled:opacity-50",
                          selected
                            ? "border-primary bg-primary/15 text-on-surface"
                            : "border-outline-soft bg-surface-low text-on-muted hover:border-primary/60 hover:text-on-surface"
                        )}
                      >
                        <span className="block font-semibold">{option.symbol}</span>
                        <span className="mt-1 block truncate font-mono text-[10px]">
                          {option.coinType}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="tip-amount-usd"
                  className="mb-2 block text-sm font-semibold"
                >
                  Amount (USD)
                </label>
                <Input
                  id="tip-amount-usd"
                  type="number"
                  min={MIN_USD}
                  max={MAX_USD}
                  step="0.01"
                  value={amountUsd}
                  onChange={(event) => {
                    setAmountUsd(event.target.value);
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={processing}
                />
                <div className="mt-2 min-h-5 text-sm text-on-muted">
                  {priceLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading {selectedToken} price
                    </span>
                  ) : priceError ? (
                    <span className="text-danger">{priceError}</span>
                  ) : selectedPrice ? (
                    <span>
                      Equivalent: {formatTokenAmount(tokenAmount)} {selectedToken}
                    </span>
                  ) : (
                    <span>Price unavailable.</span>
                  )}
                </div>
              </div>

              {success ? (
                <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    {success.label}
                  </div>
                  <a
                    href={getSuiExplorerTransactionUrl(success.digest)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-outline-soft bg-surface-high px-3 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-highest"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View digest
                  </a>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 border-t border-outline-soft p-5">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={sendTip}
                disabled={processing || priceLoading || !!priceError || !!validationError}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <HandCoins className="h-4 w-4" />
                )}
                {account ? "Send Tip" : "Connect wallet"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
