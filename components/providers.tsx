"use client";

import "@mysten/dapp-kit/dist/index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletProvider, SuiClientProvider } from "@mysten/dapp-kit";
import { JsonRpcHTTPTransport, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { useState } from "react";
import { SUI_NETWORK } from "@/lib/config";

const networks = {
  mainnet: {
    network: "mainnet" as const,
    url: "/api/sui-rpc",
    variables: {
      chain: "sui:mainnet"
    }
  }
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={networks}
        network="mainnet"
        createClient={(_, config) =>
          new SuiJsonRpcClient({
            network: "mainnet",
            transport: new JsonRpcHTTPTransport({
              url: config.url
            })
          })
        }
        onNetworkChange={(network) => {
          if (network !== SUI_NETWORK) {
            console.warn(`SuiStream is locked to ${SUI_NETWORK}.`);
          }
        }}
      >
        <WalletProvider
          autoConnect
          preferredWallets={["Sui Wallet", "Backpack", "Suiet", "Slush"]}
        >
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
