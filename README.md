<p align="center">
  <img src="frontend/public/logo.png" alt="CantonGun" width="560" />
</p>

# CantonGun

> **Confidential capital markets infrastructure on the Canton Network (L1).**
> Privacy isn't a feature — it's the professional requirement.

**🔗 Live demo:** https://cantongun-dapp.vercel.app · **Source:** https://github.com/grahamaine/cantongun-dapp

> The live site runs the in-browser demo ledger (no Canton stack required). Switch the
> **Acting as** party to watch the same ledger reveal a completely different view — that
> is Canton sub-transaction privacy, simulated client-side.

CantonGun is a DeFi DApp for **institutional, confidential finance** built on
[Canton](https://www.canton.network/), the privacy-enabled L1 whose sub-transaction
privacy model lets counterparties transact on a shared ledger while revealing data
*only* to the parties who are entitled to see it.

The $100T+ institutional capital market cannot operate on transparent public chains:
**pricing, counterparties, and positions must not be public**. Every professional
transaction begins and ends with an NDA. **CantonGun enforces NDAs
mathematically** — using Canton's native privacy plus zero-knowledge attestations —
so professionals can execute sensitive capital flows with precision and provable
compliance.

---

## Why Canton (and not Ethereum/Solana)?

| Requirement | Public L1 | Canton / CantonGun |
|---|---|---|
| Order details hidden from front-runners | ❌ public mempool | ✅ sub-transaction privacy |
| Counterparty identity confidential | ❌ pseudonymous-at-best | ✅ disclosed only to the parties |
| Selective disclosure to a regulator/auditor | ❌ all-or-nothing | ✅ explicit, signed disclosure |
| Atomic, confidential settlement | ⚠️ visible to all | ✅ private atomic swap |
| Compliance enforced *in the contract* | ❌ off-chain trust | ✅ Daml choices + ZK proofs |

Canton gives us privacy **by construction**: a contract is only ever shared with its
`signatory` and `observer` parties. We layer ZK attestations on top for facts that must
be *proven* without being *revealed* (e.g. "revenue ≥ threshold", "zero bankruptcies").

---

## How this maps to the track criteria

| Judges look for | Where CantonGun shows it |
|---|---|
| **Clear use of privacy / confidentiality** | Every contract's visibility comes from Daml `signatory`/`observer` declarations (table below). Switch the **Acting as** party in the live demo and the same ledger renders a different view — BankA never sees BankB's order, competitors never see a disclosure meant for the Regulator. |
| **A real financial use case** | Two of them, end-to-end: **confidential OTC block trading** (order → match → two-sided approval → atomic settlement → private receipts) and **private credit / invoice financing** (ZK attestation → syndicated funding → repayment → close). |
| **Strong product logic** | A coherent market structure, not infra: the Guard is the only party entitled to see crossing orders, matching is discretionary, settlement is atomic once both sides sign, and disclosure is an explicit signed act by the data owner. |
| **Institutional / professional relevance** | Pricing, counterparties, and positions are never public — there is no order book and no mempool to front-run. Compliance is selective disclosure to the regulator, invisible to everyone else. That is how block desks and private credit actually operate. |

### Who sees what — demo ↔ Daml, 1:1

The hosted demo's in-browser ledger uses the **same template names and stakeholder
sets** as the Daml model, so what judges experience in the UI is the visibility the
contracts enforce on Canton:

| Template | Daml source | Visible to (signatory → observer) | Everyone else sees |
|---|---|---|---|
| `PrivateOrder` | [OTC.daml](daml/CantonGun/OTC.daml) | trader → Guard | nothing |
| `SettlementProposal` | [OTC.daml](daml/CantonGun/OTC.daml) | Guard → buyer, seller | nothing |
| `TradeReceipt` | [OTC.daml](daml/CantonGun/OTC.daml) | Guard → buyer, seller | nothing |
| `KycCredential` | [Identity.daml](daml/CantonGun/Identity.daml) | Guard → holder | nothing |
| `AssetAttestation` | [Credit.daml](daml/CantonGun/Credit.daml) | verifier → borrower | nothing |
| `LoanRequest` | [Credit.daml](daml/CantonGun/Credit.daml) | borrower → Guard + syndicated lenders only | nothing |
| `Loan` | [Credit.daml](daml/CantonGun/Credit.daml) | borrower, lender → Guard | nothing |
| `AuditRecord` | [Audit.daml](daml/CantonGun/Audit.daml) | discloser → auditor | nothing |

**Canton status:** the Daml model builds on SDK 3.4.11 (Canton 3.x / devnet
compatible) and runs against a local Canton sandbox (`daml start`). The hosted demo
simulates the same signatory/observer boundary client-side so judges can drive the
product with zero setup; deployment to a hosted devnet participant is in progress
(pending DAR-upload access).

---

## The two flagship workflows

### 1. Confidential OTC / Block Trading (`daml/CantonGun/OTC.daml`)
A bank sells a large block without crashing the market. Orders are private; there is no
public order book to front-run. Matching and the atomic asset swap happen confidentially,
visible only to the two counterparties and the **CantonGun Guard** (auditor).

### 2. Private Credit / Invoice Financing (`daml/CantonGun/Credit.daml`)
A borrower seeks confidential invoice financing. A trusted verifier ZK-attests that the
invoices are valid and revenue meets a threshold — the *proof* is on-ledger, the
*data* (customer lists, financials) never is. Lenders fund against an asset class and a
privacy-preserving credit score, not the borrower's identity.

Both rely on:
- **Identity (`Identity.daml`)** — KYC/AML credentials issued after onboarding.
- **Audit (`Audit.daml`)** — selective, cryptographically verifiable disclosure to a
  regulator, partner, or auditor *without* leaking to competitors.

---

## Repo layout

```
CantonGun/
├── daml/                    # Canton L1 smart contracts (Daml)
│   └── CantonGun/
│       ├── Identity.daml    # KYC/AML confidential credentials
│       ├── OTC.daml         # Confidential OTC / block trading
│       ├── Credit.daml      # Private invoice financing
│       └── Audit.daml       # Selective disclosure / audit trail
├── tests/                   # End-to-end demo script (separate package so the
│   └── daml/Main.daml       #   deployable DAR stays free of daml-script)
├── frontend/                # React + TypeScript institutional UI
├── scripts/                 # Sandbox / JSON-API bootstrap
├── docs/                    # Architecture + pitch + ZK design
├── daml.yaml                # cantongun package (deployable DAR)
├── multi-package.yaml
└── canton.conf              # Canton participant/domain topology
```

## Quick start

Prerequisites: [Daml SDK](https://docs.digitalasset.com/) `3.4+` (Canton 3.x / devnet
compatible), Node `18+`.

```bash
# 1. Build the Daml model (deployable DAR + tests) and run the end-to-end demo
daml build --all
(cd tests && daml test)

# 2. Start a local Canton sandbox + JSON API (privacy-aware ledger)
./scripts/start-ledger.sh        # or: daml start

# 3. Run the institutional UI
cd frontend && npm install && npm run dev
```

### Run the UI standalone (no Canton stack required)

The frontend ships with an **in-browser demo ledger** that faithfully simulates
Canton's sub-transaction privacy: every contract carries its stakeholder set, and a
party's view returns *only* the contracts it is entitled to see — the same boundary the
real Daml JSON API enforces. So judges can drive the full product end-to-end without
running a participant:

```bash
cd frontend && npm install && npm run dev   # open http://localhost:3000
```

Switch the **Acting as** party (top right) to watch the *same* ledger reveal a
completely different view — that is privacy by construction, not access control.

**Demo script (≈90s):**
1. *BankA* submits a private SELL; *BankB* submits a private BUY — neither sees the other.
2. *Guard* opens the matching console (only it sees both), proposes a match at a clearing price.
3. *BankA* and *BankB* each approve; *Guard* settles atomically → private trade receipts.
4. Either bank clicks **Disclose to Regulator**; switch to *Regulator* → the disclosure inbox shows it (and *Fund* still sees nothing).
5. Credit desk: *Verifier* issues a ZK attestation, *Logistics* requests funding, *Guard* syndicates to *Fund*, *Fund* funds, *Logistics* repays, *Fund* closes.

The live JSON-API client lives in [`frontend/src/ledger.ts`](frontend/src/ledger.ts)
for deployment against a real participant; the demo engine is
[`frontend/src/demoLedger.ts`](frontend/src/demoLedger.ts).

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the privacy model, and
[docs/PITCH.md](docs/PITCH.md) for the hackathon narrative and judges' focus points.

## License

Apache-2.0 — see [LICENSE](LICENSE).
