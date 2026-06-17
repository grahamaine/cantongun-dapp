# CantonGun — Pitch (Institutional Confidentiality Track)

## The hook
> The $100 trillion institutional capital market cannot operate on public blockchains.
> They cannot reveal their positions, their counterparties, or their strategic deals.
> Every professional transaction starts and ends with an NDA. Public DeFi, as it
> exists today, is an open window into your business strategy.
>
> This is why we built **CantonGun**. It isn't "infra for infra's sake" — it's the
> financial tools institutions actually need: confidential OTC trading and private
> invoice financing, where privacy is the foundational requirement, not an option.
> **We enforce NDAs mathematically.** We use zero-knowledge technology to prove that a
> deal is valid and compliant, without revealing what the deal is — letting
> professionals execute complex, sensitive capital flows with precision.

## Positioning
Privacy IS the professional requirement. CantonGun is not about hiding illegal
activity — it **enforces the NDAs and strategic secrecy that make professional capital
markets function**. The brand metaphor is a *precision tool*: the system sees the
*validation*, never the raw data — like a high-definition scope locked on data
validity while the target (the private information) stays out of plain sight.

## Two use cases (live in the demo)

### 1. Private deal execution & confidential OTC trading
A bank sells a large block without crashing the market.
- **Use of privacy:** no public order book; orders, identities and prices live in
  contracts shared only with the counterparty and Guard. Matching + atomic settlement
  are confidential.
- **Why public chains fail:** market impact + front-running from a public mempool.
- **Product logic:** not a naive swap — a compliance-gated matching workflow with
  selective regulatory disclosure.

### 2. Confidential lending / private invoice financing
"Canton Logistics" raises confidential invoice financing from "Canton Capital Fund".
- **Use of privacy:** borrower's customer lists and financials never go on-ledger; a
  trusted verifier ZK-attests validity + a privacy-preserving credit score.
- **Financial use case:** unlocks the multi-trillion-dollar private credit market
  on-chain.
- **Institutional credibility:** a known verifier vouches for the underlying asset.

## Judges' focus — cheat sheet
| Criterion | CantonGun answer |
|---|---|
| Use of privacy | Canton sub-transaction privacy + ZK attestations; demo asserts non-parties see nothing |
| Financial use case | OTC block trades + private credit — real institutional flows |
| Product logic | Compliance-by-design choices, atomic settlement, selective disclosure |
| Institutional credibility | KYC-gated roles, trusted verifier, regulator audit trail |

## Branding note
Logo evolves from "weapon" to **precision tool**: replace the rifle with an elegant
**precision caliper** gripping a secure data node, retaining the circuit motif and the
glowing blue "DAPP CANTON GUN HACKATHON" ring. Metaphor shifts from *attacking* to
*precision engineering, control, and measurement*. Supporting visuals: rifle-scope /
precision sight (sees validity, not data), encrypted shield, invisible-yet-verifiable
hand.

## 60-second demo flow
1. `daml test` — both workflows run green, including the privacy assertions.
2. OTC: submit two private orders → Guard matches → both approve → atomic settle →
   disclose to regulator only.
3. Credit: verifier attests → borrower requests → fund funds → confidential repay →
   close. Show that the banks cannot see the loan and the fund cannot see the trade.
