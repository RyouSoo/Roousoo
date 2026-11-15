import type { MathToken } from '../data/questions';

interface FractionTextProps {
  tokens: MathToken[];
  className?: string;
}

export default function FractionText({ tokens, className = '' }: FractionTextProps) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-1 gap-y-1 leading-relaxed ${className}`}>
      {tokens.map((token, idx) => {
        if (token.type === 'text') {
          return <span key={idx}>{token.value}</span>;
        }
        return (
          <span key={idx} className="inline-flex items-center mx-0.5 font-bold align-middle">
            {token.whole !== undefined && (
              <span className="text-[0.95em] font-bold tabular-nums mr-0.5 leading-none">
                {token.whole}
              </span>
            )}
            <span className="inline-flex flex-col items-center justify-center leading-[1.05] text-[0.78em] tabular-nums">
              <span className="px-1 pb-0.5 border-b-2 border-current">{token.num}</span>
              <span className="px-1 pt-0.5">{token.den}</span>
            </span>
            {token.unit && <span className="ml-0.5 font-medium">{token.unit}</span>}
          </span>
        );
      })}
    </span>
  );
}
