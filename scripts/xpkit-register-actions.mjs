// One-shot: registers the two XP Kit actions used by this app.
// Run once after getting your API key from the XP Kit operator:
//   XP_KIT_URL=... XP_KIT_API_KEY=... node scripts/xpkit-register-actions.mjs

const url = process.env.XP_KIT_URL;
const key = process.env.XP_KIT_API_KEY;
if (!url || !key) {
  console.error("Set XP_KIT_URL and XP_KIT_API_KEY first.");
  process.exit(1);
}

const actions = [
  {
    slug: "swap",
    label: "Swap",
    description: "User swapped tokens via PlotswapRouter.",
    pointsDefault: 100,
    cooldownSec: 0,
    dailyCap: 0,
    totalCap: 0,
  },
  {
    slug: "add_liquidity",
    label: "Add Liquidity",
    description: "User added liquidity to a Plotswap pool.",
    pointsDefault: 150,
    cooldownSec: 0,
    dailyCap: 0,
    totalCap: 0,
  },
];

for (const action of actions) {
  const res = await fetch(`${url}/actions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(action),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) {
    console.log(`[ok] ${action.slug} -> id ${body.id} (${body.pointsDefault} XP)`);
  } else if (body?.error?.message?.includes("already exists")) {
    console.log(`[skip] ${action.slug} already registered`);
  } else {
    console.error(`[fail] ${action.slug}: ${res.status}`, body);
    process.exitCode = 1;
  }
}
