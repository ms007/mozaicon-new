import { TokenSwatch } from './TokenSwatch'

interface TokenDef {
  variable: string
  label?: string
}

interface TokenTableProps {
  tokens: TokenDef[]
}

export function TokenTable({ tokens }: TokenTableProps) {
  return (
    <div className="grid gap-3">
      {tokens.map((t) => (
        <TokenSwatch key={t.variable} variable={t.variable} label={t.label} />
      ))}
    </div>
  )
}
