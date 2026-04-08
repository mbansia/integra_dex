"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  type WalletClient,
  type PublicClient,
} from "viem";
import { integraTestnet } from "@/lib/chains";

interface Web3ContextType {
  address: `0x${string}` | null;
  walletClient: WalletClient | null;
  publicClient: PublicClient;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const publicClient = createPublicClient({
  chain: integraTestnet,
  transport: http(),
});

const Web3Context = createContext<Web3ContextType>({
  address: null,
  walletClient: null,
  publicClient,
  isConnected: false,
  isLoading: true,
  error: null,
  connect: async () => {},
  disconnect: async () => {},
});

// Lazy-load Web3Auth to avoid SSR issues
let web3authInstance: any = null;

async function getWeb3Auth() {
  if (web3authInstance) return web3authInstance;

  const { Web3Auth } = await import("@web3auth/modal");
  const { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } = await import(
    "@web3auth/base"
  );

  const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
  if (!clientId) return null;

  const w3a = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    chains: [
      {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0x666A",
        rpcTarget: "https://testnet-rpc.integralayer.com",
        displayName: "Integra Testnet",
        blockExplorerUrl: "https://explorer.integralayer.com",
        ticker: "IRL",
        tickerName: "Integra Real Life",
        logo: "https://integralayer.com/logo.png",
      },
    ],
    defaultChainId: "0x666A",
    uiConfig: {
      appName: "PlotSwap",
      theme: { primary: "#6366F1" },
      mode: "dark" as any,
      logoLight: "/plotswap-logo.svg",
      logoDark: "/plotswap-logo.svg",
    },
  });

  web3authInstance = w3a;
  return w3a;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setupWallet = useCallback(async (provider: any) => {
    const client = createWalletClient({
      chain: integraTestnet,
      transport: custom(provider),
    });
    const [addr] = await client.getAddresses();
    setAddress(addr);
    setWalletClient(client);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const w3a = await getWeb3Auth();
        if (!w3a) {
          setError("Web3Auth client ID not configured");
          setIsLoading(false);
          return;
        }

        await w3a.init();
        console.log("[PlotSwap] Web3Auth initialized, connected:", w3a.connected);

        if (w3a.connected && w3a.provider) {
          await setupWallet(w3a.provider);
        }
      } catch (err: any) {
        console.error("[PlotSwap] Web3Auth init error:", err);
        setError(err?.message || "Failed to initialize wallet");
      }
      setIsLoading(false);
    };
    init();
  }, [setupWallet]);

  const connect = useCallback(async () => {
    setError(null);
    try {
      const w3a = await getWeb3Auth();
      if (!w3a) {
        setError("Web3Auth not configured — set NEXT_PUBLIC_WEB3AUTH_CLIENT_ID");
        return;
      }

      // Ensure initialized
      if (!w3a.connected) {
        const provider = await w3a.connect();
        if (provider) {
          await setupWallet(provider);
          console.log("[PlotSwap] Connected successfully");
        }
      }
    } catch (err: any) {
      console.error("[PlotSwap] Connect error:", err);
      setError(err?.message || "Failed to connect");
    }
  }, [setupWallet]);

  const disconnect = useCallback(async () => {
    try {
      const w3a = await getWeb3Auth();
      if (w3a) {
        await w3a.logout();
      }
      setAddress(null);
      setWalletClient(null);
      setError(null);
    } catch (err: any) {
      console.error("[PlotSwap] Disconnect error:", err);
    }
  }, []);

  return (
    <Web3Context.Provider
      value={{
        address,
        walletClient,
        publicClient,
        isConnected: !!address,
        isLoading,
        error,
        connect,
        disconnect,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
