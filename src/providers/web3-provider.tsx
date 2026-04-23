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
import { triggerWalletScan } from "@/hooks/useWalletTokens";

export type ConnectMethod = "metamask";

interface Web3ContextType {
  address: `0x${string}` | null;
  walletClient: WalletClient | null;
  publicClient: PublicClient;
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  error: string | null;
  connectedWith: ConnectMethod | null;
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
  isLoading: false,
  isConnecting: false,
  error: null,
  connectedWith: null,
  connect: async () => {},
  disconnect: async () => {},
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedWith, setConnectedWith] = useState<ConnectMethod | null>(null);

  // Start wallet token scan as soon as address is known
  useEffect(() => {
    if (address) {
      triggerWalletScan(address, publicClient);
    }
  }, [address]);

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

  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);

    try {
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
                blockExplorerUrls: ["https://blockscout.integralayer.com"],
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
    setAddress(null);
    setWalletClient(null);
    setConnectedWith(null);
    setError(null);
  }, []);

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
