"use client";

import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
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
  web3auth: Web3Auth | null;
  address: `0x${string}` | null;
  walletClient: WalletClient | null;
  publicClient: PublicClient;
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const publicClient = createPublicClient({
  chain: integraTestnet,
  transport: http(),
});

const Web3Context = createContext<Web3ContextType>({
  web3auth: null,
  address: null,
  walletClient: null,
  publicClient,
  isConnected: false,
  isLoading: true,
  connect: async () => {},
  disconnect: async () => {},
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [web3auth, setWeb3Auth] = useState<Web3Auth | null>(null);
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
        if (!clientId) {
          console.warn("Web3Auth client ID not set — running in view-only mode");
          setIsLoading(false);
          return;
        }

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
            mode: "dark",
            logoLight: "/plotswap-logo.svg",
            logoDark: "/plotswap-logo.svg",
          },
        });

        await w3a.init();
        setWeb3Auth(w3a);

        if (w3a.connected && w3a.provider) {
          const client = createWalletClient({
            chain: integraTestnet,
            transport: custom(w3a.provider),
          });
          const [addr] = await client.getAddresses();
          setAddress(addr);
          setWalletClient(client);
        }
      } catch (err) {
        console.error("Web3Auth init error:", err);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const connect = useCallback(async () => {
    if (!web3auth) return;
    try {
      const provider = await web3auth.connect();
      if (provider) {
        const client = createWalletClient({
          chain: integraTestnet,
          transport: custom(provider),
        });
        const [addr] = await client.getAddresses();
        setAddress(addr);
        setWalletClient(client);
      }
    } catch (err) {
      console.error("Connect error:", err);
    }
  }, [web3auth]);

  const disconnect = useCallback(async () => {
    if (!web3auth) return;
    try {
      await web3auth.logout();
      setAddress(null);
      setWalletClient(null);
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  }, [web3auth]);

  return (
    <Web3Context.Provider
      value={{
        web3auth,
        address,
        walletClient,
        publicClient,
        isConnected: !!address,
        isLoading,
        connect,
        disconnect,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
