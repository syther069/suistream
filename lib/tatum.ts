import { JsonRpcHTTPTransport, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { TATUM_SUI_RPC_URL } from "@/lib/config";

function getClient() {
  if (!process.env.TATUM_API_KEY) {
    throw new Error("TATUM_API_KEY is required for Sui mainnet RPC.");
  }

  return new SuiJsonRpcClient({
    network: "mainnet",
    transport: new JsonRpcHTTPTransport({
      url: TATUM_SUI_RPC_URL,
      rpc: {
        headers: {
          "X-API-Key": process.env.TATUM_API_KEY
        }
      }
    })
  });
}

export async function getSuiBalance(address: string) {
  if (!address) {
    throw new Error("Sui address is required.");
  }

  return getClient().getBalance({ owner: address });
}

export async function getWalBalance(address: string) {
  if (!address) {
    throw new Error("Sui address is required.");
  }

  return getClient().getBalance({ owner: address, coinType: "0x2::wal::WAL" });
}

export async function mintContentNFT(input: {
  title: string;
  description: string;
  mediaBlobId: string;
  metadataBlobId: string;
  contentHash: string;
  creator: string;
}) {
  if (!process.env.NEXT_PUBLIC_PACKAGE_ID) {
    throw new Error(
      "NEXT_PUBLIC_PACKAGE_ID is missing. TODO: redeploy the Move package to mainnet and set the package ID."
    );
  }

  const transaction = new Transaction();

  transaction.moveCall({
    target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::content::mint_content`,
    arguments: [
      transaction.pure.string(input.title),
      transaction.pure.string(input.description),
      transaction.pure.string(input.mediaBlobId),
      transaction.pure.string(input.metadataBlobId),
      transaction.pure.string(input.contentHash),
      transaction.object("0x6")
    ]
  });

  return { transaction };
}

export async function executeTransaction(transaction: Transaction) {
  void transaction;
  throw new Error(
    "Use @mysten/dapp-kit wallet signing on the client to execute mainnet transactions."
  );
}

export async function getOwnedContent(address: string) {
  if (!address) {
    throw new Error("Sui address is required.");
  }

  return getClient().getOwnedObjects({
    owner: address,
    options: {
      showContent: true,
      showOwner: true,
      showType: true
    }
  });
}

export async function getContentEvents(cursor?: string) {
  if (!process.env.NEXT_PUBLIC_PACKAGE_ID) {
    throw new Error(
      "NEXT_PUBLIC_PACKAGE_ID is missing. Redeploy the Move package to mainnet and set it first."
    );
  }

  return getClient().queryEvents({
    query: {
      MoveModule: {
        package: process.env.NEXT_PUBLIC_PACKAGE_ID,
        module: "content"
      }
    },
    cursor: cursor ? { txDigest: cursor, eventSeq: "0" } : null
  });
}

export async function getCheckpoint(sequenceNumber = "latest") {
  const client = getClient();
  const id =
    sequenceNumber === "latest"
      ? await client.getLatestCheckpointSequenceNumber()
      : sequenceNumber;

  return client.getCheckpoint({ id });
}
