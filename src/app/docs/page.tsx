export default function DocsPage() {
  const sections = [
    {
      title: "Getting Started",
      items: [
        { q: "What is PlotSwap?", a: "PlotSwap is a decentralized exchange (DEX) for tokenized real-world assets. It uses an automated market maker (AMM) model — the same approach as Uniswap — to enable instant token swaps without order books." },
        { q: "How do I connect?", a: "Click 'Connect Wallet' and select your browser wallet (MetaMask, Rabby, etc.). PlotSwap will automatically add the correct network to your wallet if it's not already configured." },
        { q: "How do I get test tokens?", a: "Use the Wrap page to convert your native gas token (IRL) to WIRL for trading. Most tokens are pre-listed — you can also add any token by pasting its contract address." },
      ],
    },
    {
      title: "Swapping",
      items: [
        { q: "How do swaps work?", a: "PlotSwap uses constant product (x*y=k) liquidity pools. When you swap, you trade against the pool's reserves. The price adjusts based on the ratio of tokens in the pool." },
        { q: "What is slippage?", a: "Slippage is the difference between the expected price and the actual execution price. You can set a slippage tolerance in swap settings (gear icon). If the price moves beyond your tolerance, the swap reverts." },
        { q: "What is the swap fee?", a: "0.3% per trade. Of that, 0.25% goes to liquidity providers and 0.05% is an optional protocol fee." },
        { q: "Why do I need to approve tokens?", a: "ERC-20 tokens require an approval transaction before they can be transferred by a smart contract. This is a one-time step per token — you approve the Router to spend your tokens on your behalf." },
      ],
    },
    {
      title: "Liquidity Pools",
      items: [
        { q: "What is a liquidity pool?", a: "A pool holds reserves of two tokens. Traders swap against these reserves. As a liquidity provider (LP), you deposit equal value of both tokens and receive LP tokens representing your share." },
        { q: "How do I add liquidity?", a: "Go to the Pool page, select two tokens, enter amounts, and click Supply. You'll need to approve both tokens first. You'll receive LP tokens that track your share of the pool." },
        { q: "How do I remove liquidity?", a: "On the Pool page, find your position, click Remove, select the percentage to withdraw, and confirm. Your LP tokens are burned and you receive both tokens proportional to your share." },
        { q: "What is impermanent loss?", a: "When token prices change after you deposit, you may end up with less value than if you had simply held the tokens. This is called impermanent loss. It's 'impermanent' because it reverses if prices return to the original ratio." },
      ],
    },
    {
      title: "IRL & WIRL",
      items: [
        { q: "What is IRL?", a: "IRL is the native gas token of the network — used for transaction fees, similar to ETH on Ethereum." },
        { q: "What is WIRL?", a: "WIRL (Wrapped IRL) is an ERC-20 version of the native IRL token. Since AMM contracts require ERC-20 tokens, you need to wrap your IRL before trading. It's always 1:1." },
        { q: "How do I wrap IRL?", a: "Go to the Wrap page in the navigation. Enter the amount of IRL you want to wrap and click 'Wrap'. You can unwrap back to IRL at any time." },
      ],
    },
    {
      title: "Security Tokens (ERC-1404)",
      items: [
        { q: "What are ERC-1404 tokens?", a: "ERC-1404 is a standard for security tokens with built-in transfer restrictions. Token issuers can enforce compliance rules like whitelisting, jurisdiction checks, and holding period requirements." },
        { q: "How does PlotSwap handle them?", a: "Before any swap involving an ERC-1404 token, PlotSwap calls detectTransferRestriction() on-chain. If your address isn't on the whitelist, you'll see the exact restriction reason in the UI — the transaction is blocked before it reaches your wallet." },
        { q: "How do I get whitelisted?", a: "Contact the token issuer directly. Whitelisting is managed at the token contract level, not by PlotSwap." },
      ],
    },
    {
      title: "XP & Rewards",
      items: [
        { q: "What is XP?", a: "Every swap and liquidity action emits an XPAction event on-chain. XP tracks activity for rewards, reputation, and potential airdrops." },
        { q: "How much XP do I earn?", a: "First swap: 200 XP. Subsequent swaps: 100 XP. Adding liquidity: 150 XP. Removing liquidity: 50 XP." },
      ],
    },
  ];

  return (
    <div className="max-w-3xl mx-auto pt-12 px-4 pb-20">
      <h1 className="text-3xl font-bold text-plotswap-text mb-2">Documentation</h1>
      <p className="text-plotswap-text-muted mb-10">Everything you need to know about using PlotSwap.</p>

      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-plotswap-text mb-4 flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-plotswap-primary" />
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.items.map((item) => (
                <div key={item.q} className="glass-card p-4">
                  <h3 className="text-sm font-semibold text-plotswap-text mb-1.5">{item.q}</h3>
                  <p className="text-sm text-plotswap-text-muted leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
