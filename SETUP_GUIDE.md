# SuiStream Mainnet Setup Guide

This guide is for a beginner developer configuring SuiStream for Sui mainnet.

Do not paste secrets into GitHub, chat, screenshots, or shared documents. Keep real keys only in `.env.local`, which is ignored by Git.

Project root:

```txt
C:\Users\Sythe\OneDrive\Documents\suistream
```

## 1. Create `.env.local`

Create:

```txt
C:\Users\Sythe\OneDrive\Documents\suistream\.env.local
```

Add:

```txt
TATUM_API_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_SUI_NETWORK=mainnet
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus.space
NEXT_PUBLIC_WALRUS_PUBLISHER=https://publisher.walrus.space
NEXT_PUBLIC_PACKAGE_ID=TODO_REDEPLOY_TO_MAINNET
```

Do not put real secrets in `.env.example`.

## TATUM API SETUP

Tatum provides the Sui mainnet RPC gateway used by this project.

Official links:

- Tatum dashboard: https://dashboard.tatum.io
- Tatum docs: https://docs.tatum.io/docs/getting-started
- Tatum Sui gateway: https://tatum.io/chain/sui

### Create A Tatum Account

1. Go to `https://dashboard.tatum.io`.
2. Sign up or log in.
3. Open the API dashboard.
4. Find the API keys area.
5. Copy your API key.

### Add The Key

Open:

```txt
C:\Users\Sythe\OneDrive\Documents\suistream\.env.local
```

Set:

```txt
TATUM_API_KEY=YOUR_TATUM_API_KEY
```

### Where The App Reads `TATUM_API_KEY`

Files:

```txt
C:\Users\Sythe\OneDrive\Documents\suistream\app\api\sui-rpc\route.ts
C:\Users\Sythe\OneDrive\Documents\suistream\lib\tatum.ts
C:\Users\Sythe\OneDrive\Documents\suistream\scripts\check-tatum.ts
```

The browser does not receive the key. The wallet provider calls:

```txt
/api/sui-rpc
```

That API route forwards requests to:

```txt
https://sui-mainnet.gateway.tatum.io
```

with:

```txt
X-API-Key: TATUM_API_KEY
```

### Verify Tatum

Run:

```bash
npm run check:tatum -- 0xYOUR_MAINNET_SUI_ADDRESS
```

Successful output should show:

- SUI balance response
- Owned objects response
- Latest checkpoint response

### Tatum Troubleshooting

If `TATUM_API_KEY is missing` appears:

- Confirm `.env.local` exists in the project root.
- Confirm the variable name is exactly `TATUM_API_KEY`.
- Restart the dev server.

If you see `401` or `403`:

- Copy the key again from the Tatum dashboard.
- Remove extra spaces.
- Confirm the key is active.

If an address has zero balance:

- The RPC may still be working.
- Use a real mainnet address that owns SUI.

## OPENAI API SETUP

OpenAI is used for image analysis, moderation, tags, and descriptions.

Official links:

- OpenAI platform: https://platform.openai.com
- API keys: https://platform.openai.com/api-keys

### Create An OpenAI Key

1. Go to `https://platform.openai.com`.
2. Open the API keys settings page.
3. Create a new secret key.
4. Copy it immediately.

### Add The Key

Open:

```txt
C:\Users\Sythe\OneDrive\Documents\suistream\.env.local
```

Set:

```txt
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

### Test AI Moderation

Run:

```bash
npm run check:openai -- ./image.png
```

Successful output should include `tags`, `description`, `safetyScore`, and `moderationStatus`.

File that consumes this key:

```txt
C:\Users\Sythe\OneDrive\Documents\suistream\lib\ai.ts
```

## WALRUS CONFIGURATION

SuiStream uses Walrus mainnet endpoints.

Required package files:

```txt
C:\Users\Sythe\OneDrive\Documents\suistream\package.json
C:\Users\Sythe\OneDrive\Documents\suistream\lib\walrus.ts
```

Installed packages:

```txt
@mysten/walrus
@mysten/sui
```

Mainnet endpoints:

```txt
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus.space
NEXT_PUBLIC_WALRUS_PUBLISHER=https://publisher.walrus.space
```

Walrus uploads need:

- SUI for transaction gas when signing storage transactions
- WAL for storage fees when using wallet-paid SDK flows
- Publisher access when using the configured publisher endpoint

The exact fee depends on file size, epochs, and mainnet prices. This project uses:

```txt
epochs=3
deletable=true
```

### Verify Walrus Uploads

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000/upload`.
3. Connect a real mainnet wallet.
4. Select an image.
5. Click `Mint NFT & Store`.
6. Confirm the UI shows media and metadata blob IDs.
7. Read blobs through the aggregator URL:

```txt
https://aggregator.walrus.space/v1/blobs/YOUR_BLOB_ID
```

## SUI WALLET TESTING

The app uses `@mysten/dapp-kit` and Wallet Standard wallets. It supports installed wallets such as Sui Wallet, Backpack, Suiet, and Slush when they expose Sui signing features.

Wallet provider files:

```txt
C:\Users\Sythe\OneDrive\Documents\suistream\components\providers.tsx
C:\Users\Sythe\OneDrive\Documents\suistream\components\wallet-connect-button.tsx
```

### Install Sui Wallet / Slush

Official Sui start page:

```txt
https://www.sui.io/get-started
```

Slush:

```txt
https://slush.app
```

Steps:

1. Install from the official link.
2. Create or import a wallet.
3. Fund it with mainnet SUI.
4. Open SuiStream and click `Connect Wallet`.

### Install Backpack

Official link:

```txt
https://backpack.app
```

Steps:

1. Install Backpack.
2. Create or import a wallet.
3. Enable Sui support.
4. Connect from SuiStream.

### Install Suiet

Official link:

```txt
https://suiet.app
```

Steps:

1. Install Suiet.
2. Create or import a wallet.
3. Connect from SuiStream.

### Switching Wallets

1. Disconnect from the current wallet in the wallet menu.
2. Select another wallet or account.
3. Refresh the page if the browser extension caches the previous wallet.
4. Click `Connect Wallet` again.

## MAINNET DEPLOYMENT CHECKLIST

```txt
[ ] Add TATUM_API_KEY
[ ] Add OPENAI_API_KEY
[ ] Set NEXT_PUBLIC_SUI_NETWORK=mainnet
[ ] Set NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus.space
[ ] Set NEXT_PUBLIC_WALRUS_PUBLISHER=https://publisher.walrus.space
[ ] Deploy Move package to Sui mainnet
[ ] Add NEXT_PUBLIC_PACKAGE_ID
[ ] Connect wallet
[ ] Upload media
[ ] Verify Walrus upload
[ ] Mint NFT
[ ] Verify transaction on Sui Explorer
```

Sui Explorer:

```txt
https://suiexplorer.com
```

## Move Package

Move package path:

```txt
C:\Users\Sythe\OneDrive\Documents\suistream\contracts\suistream
```

Source file:

```txt
C:\Users\Sythe\OneDrive\Documents\suistream\contracts\suistream\sources\content.move
```

Publish to mainnet, then update:

```txt
NEXT_PUBLIC_PACKAGE_ID=YOUR_MAINNET_PACKAGE_ID
```
