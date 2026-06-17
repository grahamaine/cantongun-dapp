# CantonGun

> **Confidential capital markets infrastructure on the Canton Network (L1).**
> Privacy isn't a feature — it's the professional requirement.

CantonGun is a DeFi DApp for **institutional, confidential finance** built on
[Canton](https://www.canton.network/), the privacy-enabled L1 whose sub-transaction
privacy model lets counterparties transact on a shared ledger while revealing data
*only* to the parties who are entitled to see it.

The $100T+ institutional capital market cannot operate on transparent public chains:
banks cannot reveal their positions, counterparties, or strategic deals. Every
professional transaction begins and ends with an NDA. **CantonGun enforces NDAs
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
│   ├── Main.daml            # End-to-end demo script
│   └── CantonGun/
│       ├── Identity.daml    # KYC/AML confidential credentials
│       ├── OTC.daml         # Confidential OTC / block trading
│       ├── Credit.daml      # Private invoice financing
│       └── Audit.daml       # Selective disclosure / audit trail
├── frontend/                # React + TypeScript institutional UI
├── scripts/                 # Sandbox / JSON-API bootstrap
├── docs/                    # Architecture + pitch + ZK design
├── daml.yaml
└── canton.conf              # Canton participant/domain topology
```

## Quick start

Prerequisites: [Daml SDK](https://docs.daml.com/getting-started/installation.html) `2.8+`,
Node `18+`.

```bash
# 1. Build the Daml model and run the end-to-end demo
daml build
daml test

# 2. Start a local Canton sandbox + JSON API (privacy-aware ledger)
./scripts/start-ledger.sh        # or: daml start

# 3. Run the institutional UI
cd frontend && npm install && npm run dev
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the privacy model, and
[docs/PITCH.md](docs/PITCH.md) for the hackathon narrative and judges' focus points.

## License

Apache-2.0 — see [LICENSE](LICENSE).
