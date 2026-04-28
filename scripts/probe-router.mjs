// Sanity-check the deployed router. If bestRoute / getAllPoolsInfo revert
// even though every pair is healthy, the deployed bytecode may be an older
// router that doesn't include those "additive" functions at all. Calling a
// non-existent function on a contract with no fallback reverts with empty data.
//
//   node scripts/probe-router.mjs

import { createPublicClient, http, getAddress, encodeFunctionData, keccak256, toBytes } from "viem";

const RPC_URL = process.env.RPC_URL ?? "https://testnet.integralayer.com/evm";
const ROUTER  = getAddress(process.env.ROUTER ?? "0xF859054CF3CF679462aaDc188956d403Ed9D7990");

const client = createPublicClient({ transport: http(RPC_URL) });

const sigs = [
  // Library forwards — should exist on every version.
  "factory() returns (address)",
  "WIRL() returns (address)",
  "getAmountsOut(uint256,address[]) returns (uint256[])",
  // Additive functions — what we suspect is missing.
  "getAllPoolsInfo() returns ((address,address,address,uint112,uint112)[])",
  "bestRoute(address,address,uint256) returns (address[],uint256)",
  "quoteWithSlippage(uint256,address[],uint256) returns (uint256,uint256)",
  "getPoolTokens(address) returns (address,address)",
  "getPoolReserves(address) returns (uint112,uint112)",
  "isWhitelistedForPair(address,address) returns (bool,uint8,string)",
  "swapExactETHForTokens(uint256,address[],address,uint256) returns (uint256[])",
];

function selectorOf(sig) {
  const name = sig.split(" returns")[0];
  return keccak256(toBytes(name)).slice(0, 10); // 0x + 4 bytes
}

async function probe(sig) {
  const name = sig.split("(")[0];
  const sel = selectorOf(sig);
  // Use eth_call with just the selector (no args). Reverts are fine — what
  // we care about is the *kind* of revert. A nonexistent function reverts
  // with empty data; a real function called with bad args reverts with a
  // specific error.
  try {
    const data = await client.request({
      method: "eth_call",
      params: [{ to: ROUTER, data: sel }, "latest"],
    });
    return { name, sel, exists: true, data };
  } catch (e) {
    const msg = (e?.shortMessage ?? e?.message ?? String(e)).split("\n")[0];
    // viem surfaces revert data when present.
    const hasData = /reverted with the following reason/.test(msg)
                 || /reason:/.test(msg)
                 || /returned data:/.test(msg);
    return { name, sel, exists: hasData, msg: msg.slice(0, 160) };
  }
}

async function main() {
  console.log(`Router ${ROUTER}\n`);

  const code = await client.getBytecode({ address: ROUTER });
  console.log(`bytecode: ${code ? (code.length - 2) / 2 : 0} bytes\n`);

  if (!code || code === "0x") {
    console.log("ROUTER HAS NO CODE — wrong address, or never deployed.");
    return;
  }

  const codeHex = code.toLowerCase();

  console.log("Selector embedded in bytecode? (a 'yes' means the function is in the deployed dispatcher):\n");
  for (const sig of sigs) {
    const sel = selectorOf(sig);
    const embedded = codeHex.includes(sel.slice(2)); // drop 0x
    const name = sig.split("(")[0];
    console.log(`  ${embedded ? "YES" : " no"}  ${sel}  ${name}`);
  }

  console.log("\nLive eth_call probes (zero-arg, mostly to confirm the dispatcher behavior):\n");
  for (const sig of sigs) {
    const r = await probe(sig);
    if (r.exists && r.data !== undefined) {
      console.log(`  OK    ${r.sel}  ${r.name}  → returned ${r.data.length} hex chars`);
    } else if (r.msg) {
      console.log(`  ERR   ${r.sel}  ${r.name}  → ${r.msg}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
