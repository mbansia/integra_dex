export function XpHint({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[10px] text-plotswap-text-subtle text-center mt-2 ${className}`}
      title="Earn 1000 XP per qualifying action, capped at 5 per day and 30 lifetime per wallet."
    >
      +1000 XP · up to 5/day, 30 lifetime
    </p>
  );
}
