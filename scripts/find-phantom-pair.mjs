// Walks every pair in the Plotswap factory and probes getReserves() / token0() / token1().
// Reports which (if any) is the "phantom" pair that reverts silently — the one
// poisoning getAllPoolsInfo() and bestRoute() across every routable pair.
//
//   node scripts/find-phantom-pair.mjs
//
// Optional:
//   RPC_URL=...         override (default: https://testnet.integralayer.com/evm)
//   FACTORY=0x...       override factory address
//   PROBE_PAIR=tIn,tOut  also test factory.getPair(tIn, tOut) and bestRoute on it

import { createPublicClient, http, getAddress } from "viem";

const RPC_URL = process.env.RPC_URL ?? "https://testnet.integralayer.com/evm";
const FACTORY = getAddress(process.env.FACTORY ?? "0x5a9E1b7634F36f5E8752160c018e1cF1e8ED5C1d");
const ROUTER = getAddress(process.env.ROUTER ?? "0xF859054CF3CF679462aaDc188956d403Ed9D7990");

const TUSD_I = "0xa640d8b5c9cb3b989881b8e63b0f30179c78a04f";
const WIRL   = "0x0d9493f6dA7728ad1D43316674eFD679Ab104e34";

const FACTORY_ABI = [
  { type: "function", name: "allPairsLength", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allPairs", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }] },
  { type: "function", name: "getPair", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "address" }] },
];

const PAIR_ABI = [
  { type: "function", name: "token0", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "token1", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "getReserves", stateMutability: "view", inputs: [], outputs: [{ type: "uint112" }, { type: "uint112" }, { type: "uint32" }] },
];

const ROUTER_ABI = [
  {
    type: "function", name: "bestRoute", stateMutability: "view",
    inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }],
    outputs: [{ type: "address[]" }, { type: "uint256" }],
  },
  {
    type: "function", name: "getAllPoolsInfo", stateMutability: "view",
    inputs: [],
    outputs: [{
      type: "tuple[]",
      components: [
        { type: "address", name: "pool" },
        { type: "address", name: "token0" },
        { type: "address", name: "token1" },
        { type: "uint112", name: "reserve0" },
        { type: "uint112", name: "reserve1" },
      ],
    }],
  },
];

const ERC20_ABI = [
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
];

const client = createPublicClient({ transport: http(RPC_URL) });

async function bytecodeAt(addr) {
  try { return await client.getBytecode({ address: addr }); } catch { return undefined; }
}

async function trySymbol(addr) {
  try { return await client.readContract({ address: addr, abi: ERC20_ABI, functionName: "symbol" }); } catch { return null; }
}

const probeReserves = (addr) =>
  client.readContract({ address: addr, abi: PAIR_ABI, functionName: "getReserves" })
    .then((r) => ({ ok: true, r0: r[0].toString(), r1: r[1].toString() }))
    .catch((e) => ({ ok: false, err: shortErr(e) }));

const probeToken = (addr, fn) =>
  client.readContract({ address: addr, abi: PAIR_ABI, functionName: fn })
    .then((v) => ({ ok: true, v }))
    .catch((e) => ({ ok: false, err: shortErr(e) }));

function shortErr(e) {
  const msg = e?.shortMessage ?? e?.message ?? String(e);
  return msg.split("\n")[0].slice(0, 140);
}

async function main() {
  console.log(`RPC      ${RPC_URL}`);
  console.log(`Factory  ${FACTORY}`);
  console.log(`Router   ${ROUTER}\n`);

  const len = Number(
    await client.readContract({ address: FACTORY, abi: FACTORY_ABI, functionName: "allPairsLength" })
  );
  console.log(`Factory reports ${len} pair(s).\n`);

  const phantoms = [];
  for (let i = 0; i < len; i++) {
    const pair = await client.readContract({
      address: FACTORY, abi: FACTORY_ABI, functionName: "allPairs", args: [BigInt(i)],
    });
    const code = await bytecodeAt(pair);
    const codeLen = code ? (code.length - 2) / 2 : 0;
    const t0 = await probeToken(pair, "token0");
    const t1 = await probeToken(pair, "token1");
    const r  = await probeReserves(pair);

    const t0sym = t0.ok ? (await trySymbol(t0.v)) ?? "?" : "?";
    const t1sym = t1.ok ? (await trySymbol(t1.v)) ?? "?" : "?";

    const verdict = code === undefined || codeLen === 0
      ? "PHANTOM (no bytecode)"
      : !r.ok ? "PHANTOM (getReserves reverts)"
      : "ok";

    if (verdict.startsWith("PHANTOM")) phantoms.push({ i, pair, verdict });

    console.log(
      `  [${i}] ${pair}  code=${codeLen}b  token0=${t0.ok ? t0.v : "ERR"}(${t0sym})  token1=${t1.ok ? t1.v : "ERR"}(${t1sym})  reserves=${r.ok ? `${r.r0}/${r.r1}` : `ERR(${r.err})`}  → ${verdict}`
    );
  }

  console.log("");
  if (phantoms.length === 0) {
    console.log("No phantom pairs found by per-pair probe.");
  } else {
    console.log(`Found ${phantoms.length} phantom pair(s):`);
    for (const p of phantoms) console.log(`  allPairs(${p.i}) = ${p.pair}  — ${p.verdict}`);
  }

  console.log("\n--- bestRoute(tUSDi, WIRL, 1e18) ---");
  try {
    const out = await client.readContract({
      address: ROUTER, abi: ROUTER_ABI, functionName: "bestRoute",
      args: [getAddress(TUSD_I), getAddress(WIRL), 10n ** 18n],
    });
    console.log(`  path:        [${out[0].join(", ")}]`);
    console.log(`  amountOut:   ${out[1].toString()}`);
  } catch (e) {
    console.log(`  REVERT: ${shortErr(e)}`);
  }

  console.log("\n--- factory.getPair(tUSDi, WIRL) ---");
  try {
    const p = await client.readContract({
      address: FACTORY, abi: FACTORY_ABI, functionName: "getPair",
      args: [getAddress(TUSD_I), getAddress(WIRL)],
    });
    console.log(`  ${p}`);
    if (p !== "0x0000000000000000000000000000000000000000") {
      const code = await bytecodeAt(p);
      const r = await probeReserves(p);
      console.log(`  code: ${code ? (code.length - 2) / 2 + " bytes" : "0 bytes (EOA / not deployed)"}`);
      console.log(`  getReserves: ${r.ok ? `${r.r0}/${r.r1}` : `REVERT(${r.err})`}`);
    }
  } catch (e) {
    console.log(`  REVERT: ${shortErr(e)}`);
  }

  console.log("\n--- router.getAllPoolsInfo() ---");
  try {
    const pools = await client.readContract({
      address: ROUTER, abi: ROUTER_ABI, functionName: "getAllPoolsInfo",
    });
    console.log(`  returned ${pools.length} pool(s) — function does NOT revert.`);
  } catch (e) {
    console.log(`  REVERT: ${shortErr(e)}  (expected if any phantom exists)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
