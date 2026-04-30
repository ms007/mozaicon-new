import { TokenSwatch } from './TokenSwatch'

interface TokenEntry {
  label: string
  variable: string
}

interface TokenTableProps {
  title?: string
  tokens: TokenEntry[]
}

export function TokenTable({ title, tokens }: TokenTableProps) {
  return (
    <section data-testid="token-table">
      {title && <h3 className="text-foreground mb-3 text-lg font-semibold">{title}</h3>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tokens.map((token) => (
          <TokenSwatch key={token.variable} variable={token.variable} label={token.label} />
        ))}
      </div>
    </section>
  )
}
