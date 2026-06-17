# CantonGun Architecture

## Privacy model — how data is hidden

CantonGun stacks two layers of confidentiality:

### 1. Canton sub-transaction privacy (native)
On Canton, a contract is only ever distributed to its **`signatory`** and
**`observer`** parties. There is no global view of the ledger. This is the
mechanism that hides:

- `PrivateOrder` — visible only to the submitting trader and the Guard. **No public
  order book exists**, so there is nothing for front-runners to read.
- `SettlementProposal` / `TradeReceipt` — visible only to the two counterparties and
  the Guard. A competitor (or any other bank on the network) cannot even observe that
  the trade happened.
- `Loan` — visible only to borrower, lender and Guard.

The Daml test in [`daml/Main.daml`](../daml/Main.daml) *asserts* these boundaries:
an unrelated party querying for the other workflow's contracts gets an empty result.

### 2. ZK / commitment layer (proof-without-data)
Some facts must be **proven** to parties who must not see the **data**. We represent
these as commitments + attestations carried in contract fields:

| Field | Meaning |
|---|---|
| `KycCredential.kycCommitment` | hash / ZK reference to the full KYC dossier — raw documents never touch the ledger |
| `AssetAttestation.evidenceCommitment` | ZK proof reference over invoices / financials |
| `AssetAttestation.revenueAboveThresh`, `invoicesValid`, `zeroBankruptcies` | booleans *proven* by the verifier, not raw figures |
| `AuditRecord.dataCommitment` | hash of full trade/loan detail for reconciliation |

> In production, the boolean attestations are replaced by on-ledger verification of a
> zk-SNARK: the verifier publishes a proof π and a public input commitment; the Daml
> choice (or an interop verifier contract) checks π before allowing funding. The
> contract shape here is the integration point for that proof.

## Compliance by design
Confidentiality is enforced *inside* the contracts, not by off-ledger trust:

- `submitOrder` / `Fund` refuse parties without the correct `KycCredential` role.
- `AssetAttestation.MeetsPolicy` encodes the lending gate
  (`revenue ≥ threshold ∧ invoices valid ∧ zero bankruptcies ∧ score ≥ min`).
- `SettlementProposal.Settle` is atomic and requires **both** counterparties'
  approval — no half-settled state.

## Selective disclosure
`Audit.daml` makes disclosure an explicit, signed act. `DiscloseToRegulator` /
`DisclosureRequest.Fulfil` create an `AuditRecord` observed *only* by the chosen
auditor — control stays with the institution: it chooses **what**, **to whom**, and
**when**.

## Topology
See [`canton.conf`](../canton.conf). The demo uses one participant + one domain. A
realistic deployment runs **one participant per institution**, each connected to a
shared sync domain — privacy holds across participants because Canton never ships a
contract to a participant that hosts none of its stakeholders.

## Components
```
┌─────────────┐   JSON API    ┌──────────────────┐   Ledger API   ┌────────────┐
│  Frontend   │ ───────────▶ │  Daml JSON API   │ ─────────────▶ │ Participant │
│ (React/TS)  │              │  (per-party JWT) │                │  (Canton)  │
└─────────────┘              └──────────────────┘                └─────┬──────┘
                                                                       │
                                                                ┌──────▼──────┐
                                                                │ Sync Domain │
                                                                └─────────────┘
```
Each frontend session authenticates as a single party; the JSON API only returns
contracts that party is entitled to — privacy is preserved end-to-end.
