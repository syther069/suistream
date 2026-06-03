import { SuiClient, SuiHTTPTransport } from "@mysten/sui/client";

export const SUI_RPC_PROXY_PATH = "/api/sui-rpc";

export function createSuiClient(rpcUrl = SUI_RPC_PROXY_PATH) {
  return new SuiClient({
    transport: new SuiHTTPTransport({
      url: rpcUrl
    })
  });
}

export const suiClient = createSuiClient();
