"use client";

import { useEffect, useState, useSyncExternalStore, useCallback } from "react";
import { parseAbiItem } from "viem";
import { useWeb3 } from "@/providers/web3-provider";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import type { TokenInfo } from "@/lib/token-list";

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);
const CHUNK_SIZE = 10000n;
const MAX_CHUNKS = 30;

// Global store — shared across all components, persists across navigations
let _address: string | null = null;
let _tokens: TokenInfo[] = [];
let _isScanning = false;
let _progress = 0;
let _scanDone = false;
let _scanPromise: Promise<void> | null = null;
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((l) => l());
}

function getSnapshot() {
  return { tokens: _tokens, isScanning: _isScanning, progress: _progress };
}

async function fetchTokenMeta(publicClient: any, addr: `0x${string}`): Promise<TokenInfo | null> {
  try {
    const [symbol, decimals] = await Promise.all([
      publicClient.readContract({ address: addr, abi: ERC20_ABI, functionName: "symbol" }),
      publicClient.readContract({ address: addr, abi: ERC20_ABI, functionName: "decimals" }),
    ]);
    let name: string;
    try {
      name = (await publicClient.readContract({
        address: addr,
        abi: [{ inputs: [], name: "name", outputs: [{ type: "string" }], stateMutability: "view", type: "function" }],
        functionName: "name",
      })) as string;
    } catch { name = symbol as string; }

    let isERC1404 = false;
    try {
      await publicClient.readContract({
        address: addr,
        abi: [{ inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }], name: "detectTransferRestriction", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" }],
        functionName: "detectTransferRestriction",
        args: ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", 0n],
      });
      isERC1404 = true;
    } catch { isERC1404 = false; }

    return { address: addr, name, symbol: symbol as string, decimals: Number(decimals), logoURI: "", isERC1404 };
  } catch {
    return null;
  }
}

async function runScan(address: `0x${string}`, publicClient: any) {
  if (_address === address && _scanDone) return;
  if (_isScanning && _address === address) return;

  _address = address;
  _isScanning = true;
  _progress = 0;
  _tokens = [];
  notify();

  try {
    const latestBlock = await publicClient.getBlockNumber();
    const uniqueTokens = new Set<string>();

    for (let i = 0; i < MAX_CHUNKS; i++) {
      const toBlock = latestBlock - BigInt(i) * CHUNK_SIZE;
      const fromBlock = toBlock - CHUNK_SIZE + 1n;
      if (fromBlock < 0n) break;

      try {
        const [logsTo, logsFrom] = await Promise.all([
          publicClient.getLogs({ event: TRANSFER_EVENT, args: { to: address }, fromBlock, toBlock }),
          publicClient.getLogs({ event: TRANSFER_EVENT, args: { from: address }, fromBlock, toBlock }),
        ]);
        [...logsTo, ...logsFrom].forEach((log) => uniqueTokens.add(log.address.toLowerCase()));
      } catch {}

      _progress = Math.round(((i + 1) / MAX_CHUNKS) * 100);
      notify();
    }

    const tokenAddrs = Array.from(uniqueTokens) as `0x${string}`[];
    const metas = await Promise.all(tokenAddrs.map((a) => fetchTokenMeta(publicClient, a)));
    _tokens = metas.filter((t): t is TokenInfo => t !== null);
    _scanDone = true;
  } catch (err) {
    console.error("[PlotSwap] Wallet token scan error:", err);
  }

  _isScanning = false;
  notify();
}

// Hook: triggers scan on first call, returns cached results instantly after
export function useWalletTokens() {
  const { address, publicClient } = useWeb3();

  const subscribe = useCallback((cb: () => void) => {
    _listeners.add(cb);
    return () => { _listeners.delete(cb); };
  }, []);

  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!address) return;
    runScan(address, publicClient);
  }, [address, publicClient]);

  return snap;
}

// Trigger scan from anywhere (e.g., layout/provider)
export function triggerWalletScan(address: `0x${string}`, publicClient: any) {
  runScan(address, publicClient);
}
