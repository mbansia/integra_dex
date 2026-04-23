"use client";

import { useCallback, useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { AGENT_AUTH_ABI } from "@/lib/abis/AgentAuth";
import { CONTRACTS } from "@/lib/contracts";

export type AgentProfile = {
  agentId: bigint;
  owner: `0x${string}`;
  name: string;
  description: string;
  endpointURI: string;
  active: boolean;
};

export function useAgents() {
  const { address, publicClient } = useWeb3();
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!address) {
      setAgents([]);
      return;
    }
    setIsLoading(true);
    try {
      const ids = (await publicClient.readContract({
        address: CONTRACTS.AgentAuth,
        abi: AGENT_AUTH_ABI,
        functionName: "getAgentsByOwner",
        args: [address],
      })) as bigint[];

      const profiles = await Promise.all(
        ids.map(async (id) => {
          try {
            const profile = (await publicClient.readContract({
              address: CONTRACTS.AgentAuth,
              abi: AGENT_AUTH_ABI,
              functionName: "getAgentProfile",
              args: [id],
            })) as any;
            // Tuple ordering based on Solidity struct — adapt if it turns out different
            return {
              agentId: id,
              owner: (profile.owner ?? profile[0]) as `0x${string}`,
              name: (profile.name ?? profile[1]) as string,
              description: (profile.description ?? profile[2]) as string,
              endpointURI: (profile.endpointURI ?? profile[3]) as string,
              active: Boolean(profile.active ?? profile[4] ?? true),
            } as AgentProfile;
          } catch {
            return null;
          }
        })
      );
      setAgents(profiles.filter((p): p is AgentProfile => p !== null));
    } catch (err) {
      console.error("[AgentAuth] getAgentsByOwner failed:", err);
    }
    setIsLoading(false);
  }, [address, publicClient]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { agents, isLoading, refresh };
}

export function useAgentAuth() {
  const { address, walletClient, publicClient } = useWeb3();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function sendTx(call: () => Promise<`0x${string}`>, label: string) {
    if (!walletClient || !address) return false;
    setIsPending(true);
    setError(null);
    setSuccess(null);
    try {
      const hash = await call();
      await publicClient.waitForTransactionReceipt({ hash });
      setSuccess(label);
      return true;
    } catch (err: any) {
      setError(err?.shortMessage || err?.message || `${label} failed`);
      return false;
    } finally {
      setIsPending(false);
    }
  }

  const registerAgent = useCallback(
    (name: string, description: string, endpointURI: string) =>
      sendTx(
        () =>
          walletClient!.writeContract({
            address: CONTRACTS.AgentAuth,
            abi: AGENT_AUTH_ABI,
            functionName: "registerAgent",
            args: [name, description, endpointURI],
            account: address!,
            chain: walletClient!.chain,
          }),
        `Registered agent "${name}"`
      ),
    [walletClient, address, publicClient]
  );

  const updateAgent = useCallback(
    (agentId: bigint, description: string, endpointURI: string) =>
      sendTx(
        () =>
          walletClient!.writeContract({
            address: CONTRACTS.AgentAuth,
            abi: AGENT_AUTH_ABI,
            functionName: "updateAgent",
            args: [agentId, description, endpointURI],
            account: address!,
            chain: walletClient!.chain,
          }),
        "Agent updated"
      ),
    [walletClient, address, publicClient]
  );

  const pauseAgent = useCallback(
    (agentId: bigint) =>
      sendTx(
        () =>
          walletClient!.writeContract({
            address: CONTRACTS.AgentAuth,
            abi: AGENT_AUTH_ABI,
            functionName: "pauseAgent",
            args: [agentId],
            account: address!,
            chain: walletClient!.chain,
          }),
        "Agent paused"
      ),
    [walletClient, address, publicClient]
  );

  const resumeAgent = useCallback(
    (agentId: bigint) =>
      sendTx(
        () =>
          walletClient!.writeContract({
            address: CONTRACTS.AgentAuth,
            abi: AGENT_AUTH_ABI,
            functionName: "resumeAgent",
            args: [agentId],
            account: address!,
            chain: walletClient!.chain,
          }),
        "Agent resumed"
      ),
    [walletClient, address, publicClient]
  );

  const deactivateAgent = useCallback(
    (agentId: bigint) =>
      sendTx(
        () =>
          walletClient!.writeContract({
            address: CONTRACTS.AgentAuth,
            abi: AGENT_AUTH_ABI,
            functionName: "deactivateAgent",
            args: [agentId],
            account: address!,
            chain: walletClient!.chain,
          }),
        "Agent deactivated"
      ),
    [walletClient, address, publicClient]
  );

  const authorize = useCallback(
    (agent: `0x${string}`, selectors: `0x${string}`[], spendLimit: bigint) =>
      sendTx(
        () =>
          walletClient!.writeContract({
            address: CONTRACTS.AgentAuth,
            abi: AGENT_AUTH_ABI,
            functionName: "authorize",
            args: [agent, selectors, spendLimit],
            account: address!,
            chain: walletClient!.chain,
          }),
        "Agent authorized"
      ),
    [walletClient, address, publicClient]
  );

  const revoke = useCallback(
    (agent: `0x${string}`) =>
      sendTx(
        () =>
          walletClient!.writeContract({
            address: CONTRACTS.AgentAuth,
            abi: AGENT_AUTH_ABI,
            functionName: "revoke",
            args: [agent],
            account: address!,
            chain: walletClient!.chain,
          }),
        "Authorization revoked"
      ),
    [walletClient, address, publicClient]
  );

  return {
    registerAgent,
    updateAgent,
    pauseAgent,
    resumeAgent,
    deactivateAgent,
    authorize,
    revoke,
    isPending,
    error,
    success,
  };
}
