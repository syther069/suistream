import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "@/lib/config";

export function buildMintContentTransaction(input: {
  title: string;
  description: string;
  mediaBlobId: string;
  metadataBlobId: string;
  contentHash: string;
}) {
  if (!PACKAGE_ID) {
    throw new Error(
      "NEXT_PUBLIC_PACKAGE_ID is missing. TODO: redeploy the Move package to mainnet and set the package ID."
    );
  }

  const transaction = new Transaction();

  transaction.moveCall({
    target: `${PACKAGE_ID}::content::mint_content`,
    arguments: [
      transaction.pure.string(input.title),
      transaction.pure.string(input.description),
      transaction.pure.string(input.mediaBlobId),
      transaction.pure.string(input.metadataBlobId),
      transaction.pure.string(input.contentHash),
      transaction.object("0x6")
    ]
  });

  return transaction;
}
