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

export type ConnectMethod = "metamask" | "web3auth";

interface Web3ContextType {
  address: `0x${string}` | null;
  walletClient: WalletClient | null;
  publicClient: PublicClient;
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  error: string | null;
  connectedWith: ConnectMethod | null;
  connect: (method: ConnectMethod) => Promise<void>;
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
  isLoading: false,
  isConnecting: false,
  error: null,
  connectedWith: null,
  connect: async () => {},
  disconnect: async () => {},
});

// Lazy-load Web3Auth
let web3authInstance: any = null;
async function getWeb3Auth() {
  if (web3authInstance) return web3authInstance;

  const { Web3Auth } = await import("@web3auth/modal");
  const { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } = await import("@web3auth/base");

  const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "BM4-vTeJRs0OW-iD2zqCUdNEbgqW-dEGMWUS53FVYpUjnKZqaBP_0njivHaDPZnNzJ8jfDd6b8gY_p0ROmIs6Jc";
  if (!clientId) return null;

  const w3a = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    chains: [
      {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0x666A",
        rpcTarget: "https://testnet.integralayer.com/evm",
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

  await w3a.init();
  web3authInstance = w3a;
  return w3a;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedWith, setConnectedWith] = useState<ConnectMethod | null>(null);

  // Check if previously connected via MetaMask
  useEffect(() => {
    const checkExisting = async () => {
      if (typeof window === "undefined") return;
      const provider = (window as any).ethereum;
      if (!provider) return;

      try {
        const accounts = await provider.request({ method: "eth_accounts" });
        if (accounts && accounts.length > 0) {
          const client = createWalletClient({
            chain: integraTestnet,
            transport: custom(provider),
          });
          const [addr] = await client.getAddresses();
          setAddress(addr);
          setWalletClient(client);
          setConnectedWith("metamask");
        }
      } catch {}
    };
    checkExisting();
  }, []);

  const connect = useCallback(async (method: ConnectMethod) => {
    setError(null);
    setIsConnecting(true);

    try {
      if (method === "metamask") {
        const provider = (window as any).ethereum;
        if (!provider) {
          setError("No wallet found. Install MetaMask or another browser wallet.");
          setIsConnecting(false);
          return;
        }

        // Request account access
        await provider.request({ method: "eth_requestAccounts" });

        // Switch to Integra Testnet
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x666A" }],
          });
        } catch (switchError: any) {
          // Chain not added, add it
          if (switchError.code === 4902) {
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x666A",
                  chainName: "Integra Testnet",
                  nativeCurrency: { name: "IRL", symbol: "IRL", decimals: 18 },
                  rpcUrls: ["https://testnet.integralayer.com/evm"],
                  blockExplorerUrls: ["https://explorer.integralayer.com"],
                },
              ],
            });
          }
        }

        const client = createWalletClient({
          chain: integraTestnet,
          transport: custom(provider),
        });
        const [addr] = await client.getAddresses();
        setAddress(addr);
        setWalletClient(client);
        setConnectedWith("metamask");

        // Listen for account changes
        provider.on("accountsChanged", (accounts: string[]) => {
          if (accounts.length === 0) {
            setAddress(null);
            setWalletClient(null);
            setConnectedWith(null);
          } else {
            setAddress(accounts[0] as `0x${string}`);
          }
        });
      } else if (method === "web3auth") {
        console.log("[PlotSwap] Connecting via Web3Auth...");
        const w3a = await getWeb3Auth();
        if (!w3a) {
          setError("Web3Auth failed to initialize. Check console for details.");
          setIsConnecting(false);
          return;
        }

        console.log("[PlotSwap] Web3Auth initialized, calling connect()...");
        const provider = await w3a.connect();
        console.log("[PlotSwap] Web3Auth connect returned, provider:", !!provider);
        if (provider) {
          const client = createWalletClient({
            chain: integraTestnet,
            transport: custom(provider),
          });
          const [addr] = await client.getAddresses();
          console.log("[PlotSwap] Web3Auth connected:", addr);
          setAddress(addr);
          setWalletClient(client);
          setConnectedWith("web3auth");
        } else {
          setError("Web3Auth login was cancelled or failed.");
        }
      }
    } catch (err: any) {
      console.error("[PlotSwap] Connect error:", err);
      if (err?.code === 4001) {
        setError("Connection rejected by user");
      } else {
        setError(err?.message || "Failed to connect");
      }
    }
    setIsConnecting(false);
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (connectedWith === "web3auth" && web3authInstance) {
        await web3authInstance.logout();
      }
    } catch {}
    setAddress(null);
    setWalletClient(null);
    setConnectedWith(null);
    setError(null);
  }, [connectedWith]);

  return (
    <Web3Context.Provider
      value={{
        address,
        walletClient,
        publicClient,
        isConnected: !!address,
        isLoading,
        isConnecting,
        error,
        connectedWith,
        connect,
        disconnect,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
