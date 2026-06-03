export const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK ?? "mainnet";

export const TATUM_SUI_RPC_URL = "https://sui-mainnet.gateway.tatum.io";

export const WALRUS_AGGREGATOR_URL =
  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR ?? "https://aggregator.walrus.space";

export const WALRUS_PUBLISHER_URL =
  process.env.NEXT_PUBLIC_WALRUS_PUBLISHER ?? "https://publisher.walrus.space";

// TODO: Redeploy the SuiStream Move package to Sui mainnet and replace these
// placeholders with the mainnet package and registry object IDs.
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID ?? "";

export const REGISTRY_ID = process.env.NEXT_PUBLIC_REGISTRY_ID ?? "";

export const SUI_EXPLORER_BASE_URL = "https://suiexplorer.com";

export function assertMainnet() {
  if (SUI_NETWORK !== "mainnet") {
    throw new Error(
      `SuiStream is configured for ${SUI_NETWORK}. Set NEXT_PUBLIC_SUI_NETWORK=mainnet.`
    );
  }
}

export function getSuiExplorerTransactionUrl(digest: string) {
  return `${SUI_EXPLORER_BASE_URL}/txblock/${digest}?network=mainnet`;
}

export function getSuiExplorerObjectUrl(objectId: string) {
  return `${SUI_EXPLORER_BASE_URL}/object/${objectId}?network=mainnet`;
}
