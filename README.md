# SuiStream

SuiStream is a mainnet-focused decentralized media MVP with AI moderation, Walrus storage, Sui ownership, and Tatum-backed Sui RPC.

## Stack

- Next.js 15 App Router
- TypeScript
- TailwindCSS with shadcn-style local UI primitives
- `@mysten/dapp-kit` real wallet connection
- `@mysten/sui`
- `@mysten/walrus`
- Tatum Sui mainnet RPC
- OpenAI moderation utilities

## Mainnet Environment

Copy `.env.example` to `.env.local`:

```txt
TATUM_API_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_SUI_NETWORK=mainnet
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus.space
NEXT_PUBLIC_WALRUS_PUBLISHER=https://publisher.walrus.space
NEXT_PUBLIC_PACKAGE_ID=TODO_REDEPLOY_TO_MAINNET
NEXT_PUBLIC_REGISTRY_ID=TODO_REDEPLOY_TO_MAINNET
```

`TATUM_API_KEY` stays server-side. Browser wallet RPC requests go through:

```txt
app/api/sui-rpc/route.ts
```

That route forwards to:

```txt
https://sui-mainnet.gateway.tatum.io
```

with the `X-API-Key` header.

## Core Flow

1. Connect a real Sui mainnet wallet through dApp Kit.
2. Upload an image.
3. Generate real tags, description, safety score, and moderation status through OpenAI.
4. Store media and metadata through the Walrus mainnet publisher relay.
5. Sign and mint a Sui content NFT with the connected wallet.
6. Browse approved content in the feed.
7. Open a content detail page with provenance.
8. Tip creators through wallet-signed mainnet transactions.

## Local Development

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

After adding a real Tatum key:

```bash
npm run check:tatum -- 0xYOUR_MAINNET_ADDRESS
```

After adding a real OpenAI key:

```bash
npm run check:openai -- ./image.png
```

## Move Contract

Contract package:

```txt
contracts/suistream
```

Important: redeploy the Move package to Sui mainnet before production use, then set:

```txt
NEXT_PUBLIC_PACKAGE_ID=YOUR_MAINNET_PACKAGE_ID
NEXT_PUBLIC_REGISTRY_ID=YOUR_MAINNET_REGISTRY_ID
```
