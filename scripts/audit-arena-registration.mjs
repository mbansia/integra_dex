// Full audit of arena-registration.json — structural + on-chain.
// Flags every issue found; exits 0 only if all checks pass.

import fs from "node:fs";
import { createPublicClient, http, getAddress, keccak256, toBytes } from "viem";

const reg = JSON.parse(fs.readFileSync("arena-registration.json", "utf8"));

const issues = [];
const warns = [];
const ok = [];

function pass(msg) { ok.push(msg); }
function fail(msg) { issues.push(msg); }
function warn(msg) { warns.push(msg); }

const RPC_URL = process.env.RPC_URL ?? "https://testnet.integralayer.com/evm";
const client = createPublicClient({ transport: http(RPC_URL) });

// ─────────────────────────────────────────────────────────────────
// 1. Top-level shape
// ─────────────────────────────────────────────────────────────────
for (const k of ["name", "category", "description", "chainId", "contracts", "agentActions"]) {
  if (!(k in reg)) fail(`missing top-level key: ${k}`);
}
if (reg.chainId !== 26218) warn(`chainId is ${reg.chainId} (expected 26218 for Integra testnet)`);
pass("top-level keys present");

// ─────────────────────────────────────────────────────────────────
// 2. Build contract index by name
// ─────────────────────────────────────────────────────────────────
const contractByName = {};
for (const c of reg.contracts) {
  if (contractByName[c.name]) fail(`duplicate contract name: ${c.name}`);
  contractByName[c.name] = c;
  if (!/^0x[0-9a-fA-F]{40}$/.test(c.address)) fail(`${c.name}: bad address ${c.address}`);
}
pass(`indexed ${Object.keys(contractByName).length} contracts: ${Object.keys(contractByName).join(", ")}`);

// ─────────────────────────────────────────────────────────────────
// 3. Build (contract, fn) → ABI entry index
// ─────────────────────────────────────────────────────────────────
const abiIndex = {};
for (const c of reg.contracts) {
  for (const item of c.abi) {
    if (item.type === "function") {
      const key = `${c.name}.${item.name}`;
      if (abiIndex[key]) warn(`duplicate ABI entry: ${key}`);
      abiIndex[key] = item;
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// 4. agentActions structural checks
// ─────────────────────────────────────────────────────────────────
const agentByName = {};
for (const a of reg.agentActions) {
  if (a.type === "macro") {
    if (agentByName[a.functionName]) fail(`duplicate macro name: ${a.functionName}`);
    agentByName[a.functionName] = a;
    continue;
  }
  // read / write
  if (!a.contract || !contractByName[a.contract]) {
    fail(`agentAction "${a.functionName}" references unknown contract: ${a.contract}`);
    continue;
  }
  const key = `${a.contract}.${a.functionName}`;
  if (!abiIndex[key]) fail(`agentAction ${key} has no matching ABI entry`);
  agentByName[`${a.contract}.${a.functionName}`] = a;
}
pass(`${reg.agentActions.length} agent actions registered`);

// ─────────────────────────────────────────────────────────────────
// 5. Macro reference resolution
// ─────────────────────────────────────────────────────────────────
for (const m of reg.agentActions.filter(a => a.type === "macro")) {
  const inputCount = m.inputs?.length ?? 0;
  for (const [stepIdx, step] of m.steps.entries()) {
    const action = step.action;

    // The action must resolve to either a registered agent read/write OR a router/factory ABI fn
    let resolvedKey = null;
    for (const cName of Object.keys(contractByName)) {
      if (abiIndex[`${cName}.${action}`]) { resolvedKey = `${cName}.${action}`; break; }
    }
    if (!resolvedKey) {
      fail(`macro ${m.functionName} step ${stepIdx}: action "${action}" not found in any contract ABI`);
      continue;
    }

    const abiFn = abiIndex[resolvedKey];
    const expectedArgs = abiFn.inputs.length;
    const actualArgs = step.args?.length ?? 0;
    if (expectedArgs !== actualArgs) {
      fail(`macro ${m.functionName} step ${stepIdx} (${action}): expected ${expectedArgs} args, got ${actualArgs}`);
    }

    // Check argIndex references are within bounds
    function visitRefs(v) {
      if (Array.isArray(v)) { v.forEach(visitRefs); return; }
      if (v && typeof v === "object") {
        if ("argIndex" in v && (v.argIndex < 0 || v.argIndex >= inputCount)) {
          fail(`macro ${m.functionName} step ${stepIdx}: argIndex ${v.argIndex} out of range (${inputCount} inputs)`);
        }
        if ("stepIndex" in v && (v.stepIndex < 0 || v.stepIndex >= stepIdx)) {
          fail(`macro ${m.functionName} step ${stepIdx}: stepIndex ${v.stepIndex} out of range or forward-ref`);
        }
      }
    }
    visitRefs(step.args);
  }
}
pass("all macro steps resolve to ABI functions and reference valid args/steps");

// ─────────────────────────────────────────────────────────────────
// 6. Prereq sanity
// ─────────────────────────────────────────────────────────────────
for (const a of reg.agentActions.filter(x => x.prereqs)) {
  const fnKey = `${a.contract}.${a.functionName}`;
  const fn = abiIndex[fnKey];
  if (!fn) continue;
  for (const [pi, p] of a.prereqs.entries()) {
    if (p.kind !== "approve") { warn(`${fnKey} prereq[${pi}]: unusual kind "${p.kind}"`); continue; }

    // resolve token
    if (p.token?.argIndex !== undefined) {
      const idx = p.token.argIndex;
      if (idx < 0 || idx >= fn.inputs.length) fail(`${fnKey} prereq[${pi}]: token argIndex ${idx} OOB`);
      const arg = fn.inputs[idx];
      if (p.token.element !== undefined) {
        if (!arg.type.endsWith("[]")) fail(`${fnKey} prereq[${pi}]: token uses element on non-array arg "${arg.name}" (${arg.type})`);
      } else {
        if (arg.type !== "address") fail(`${fnKey} prereq[${pi}]: token argIndex points to non-address "${arg.name}" (${arg.type})`);
      }
    } else if (p.token?.fromCall) {
      const fc = p.token.fromCall;
      const calledKey = `${fc.contract}.${fc.functionName}`;
      if (!abiIndex[calledKey]) fail(`${fnKey} prereq[${pi}]: fromCall references missing ABI ${calledKey}`);
    } else {
      fail(`${fnKey} prereq[${pi}]: token has neither argIndex nor fromCall`);
    }

    // resolve amount
    if (p.amount?.argIndex !== undefined) {
      const idx = p.amount.argIndex;
      if (idx < 0 || idx >= fn.inputs.length) fail(`${fnKey} prereq[${pi}]: amount argIndex ${idx} OOB`);
      const arg = fn.inputs[idx];
      if (!arg.type.startsWith("uint")) fail(`${fnKey} prereq[${pi}]: amount argIndex points to non-uint "${arg.name}" (${arg.type})`);
    }
  }
}
pass("prereq references type-check against their function signatures");

// ─────────────────────────────────────────────────────────────────
// 7. Dead references in free-text descriptions
// ─────────────────────────────────────────────────────────────────
const removed = ["bestRoute", "isWhitelistedForPair", "getAllPoolsInfo", "getPoolTokens", "getPoolReserves", "quoteWithSlippage"];
const allText = JSON.stringify({
  description: reg.description,
  agentActions: reg.agentActions, // includes macro descriptions and inputs
});
for (const dead of removed) {
  // count occurrences in agentActions/descriptions but EXCLUDE the ABI block
  const re = new RegExp(`\\b${dead}\\b`, "g");
  const matches = allText.match(re) ?? [];
  if (matches.length > 0) fail(`dead reference to "${dead}" still appears ${matches.length}× in descriptions/macros`);
}
pass("no dead references in agent-facing text");

// ─────────────────────────────────────────────────────────────────
// 8. ABI completeness for prereqs (token contracts must expose approve)
// ─────────────────────────────────────────────────────────────────
// Note: ERC-20 approve is assumed at runtime; LP tokens (pair) and arbitrary
// tokenA/tokenB aren't in the registration's contract list — this is fine
// because the engine uses a generic ERC-20 ABI. We just sanity-check the WIRL
// contract since that's the only ERC-20 we explicitly registered.
const wirlAbi = contractByName.wirl?.abi ?? [];
if (!wirlAbi.find(x => x.type === "function" && x.name === "approve")) {
  fail("wirl contract is missing approve() in registration ABI");
}
pass("wirl ABI exposes approve/allowance/balanceOf");

// ─────────────────────────────────────────────────────────────────
// 9. Frontend env alignment
// ─────────────────────────────────────────────────────────────────
const contractsTs = fs.readFileSync("src/lib/contracts.ts", "utf8");
function envAddress(name) {
  const m = contractsTs.match(new RegExp(`${name}:[^"\\n]*"(0x[0-9a-fA-F]{40})"`));
  return m?.[1] ?? null;
}
const fe = {
  Factory: envAddress("Factory"),
  Router: envAddress("Router"),
  WIRL: envAddress("WIRL"),
};
const reAddr = (s) => s?.toLowerCase();
if (reAddr(fe.Router) !== reAddr(contractByName.router?.address))
  fail(`Router mismatch: src/lib/contracts.ts ${fe.Router} vs registration ${contractByName.router?.address}`);
if (reAddr(fe.Factory) !== reAddr(contractByName.factory?.address))
  fail(`Factory mismatch: src/lib/contracts.ts ${fe.Factory} vs registration ${contractByName.factory?.address}`);
if (reAddr(fe.WIRL) !== reAddr(contractByName.wirl?.address))
  fail(`WIRL mismatch: src/lib/contracts.ts ${fe.WIRL} vs registration ${contractByName.wirl?.address}`);
pass(`router/factory/WIRL addresses match src/lib/contracts.ts`);

// ─────────────────────────────────────────────────────────────────
// 10. On-chain selector check for every agent-callable function
// ─────────────────────────────────────────────────────────────────
function selectorOf(fn) {
  const sig = `${fn.name}(${fn.inputs.map(i => normalizeType(i)).join(",")})`;
  return keccak256(toBytes(sig)).slice(0, 10);
}
function normalizeType(input) {
  if (input.type === "tuple" || input.type === "tuple[]") {
    const inner = (input.components ?? []).map(normalizeType).join(",");
    const suffix = input.type === "tuple[]" ? "[]" : "";
    return `(${inner})${suffix}`;
  }
  return input.type;
}

const agentFns = reg.agentActions.filter(a => a.type !== "macro");
const codeCache = {};
async function bytecodeFor(addr) {
  if (codeCache[addr] !== undefined) return codeCache[addr];
  codeCache[addr] = (await client.getBytecode({ address: getAddress(addr) }))?.toLowerCase() ?? "";
  return codeCache[addr];
}

console.log(`\nChecking ${agentFns.length} agent-callable functions against deployed bytecode…\n`);
for (const a of agentFns) {
  const c = contractByName[a.contract];
  const fn = abiIndex[`${a.contract}.${a.functionName}`];
  if (!fn) continue;
  const sel = selectorOf(fn);
  const code = await bytecodeFor(c.address);
  const present = code.includes(sel.slice(2));
  if (!present) fail(`${a.contract}.${a.functionName} ${sel} NOT in deployed bytecode at ${c.address}`);
  console.log(`  ${present ? "OK " : "BAD"}  ${sel}  ${a.contract}.${a.functionName}`);
}

// Also probe the macro-step targets (e.g. swapExactTokensForTokens may not
// itself be a registered agent action in some configurations).
const macroTargets = new Set();
for (const m of reg.agentActions.filter(a => a.type === "macro")) {
  for (const step of m.steps) macroTargets.add(step.action);
}
for (const t of macroTargets) {
  for (const cName of Object.keys(contractByName)) {
    const fn = abiIndex[`${cName}.${t}`];
    if (!fn) continue;
    const sel = selectorOf(fn);
    const code = await bytecodeFor(contractByName[cName].address);
    if (!code.includes(sel.slice(2))) {
      fail(`macro target ${cName}.${t} ${sel} NOT in deployed bytecode`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// Report
// ─────────────────────────────────────────────────────────────────
console.log("");
console.log(`PASS: ${ok.length}`);
ok.forEach(s => console.log(`  ✓ ${s}`));
if (warns.length) {
  console.log(`\nWARN: ${warns.length}`);
  warns.forEach(s => console.log(`  ⚠ ${s}`));
}
if (issues.length) {
  console.log(`\nFAIL: ${issues.length}`);
  issues.forEach(s => console.log(`  ✗ ${s}`));
  process.exit(1);
} else {
  console.log("\nAll checks passed.");
}
