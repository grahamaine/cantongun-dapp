import { useState } from "react";
import { ledger, Templates, Contract } from "../ledger";

interface LoanRequestPayload {
  borrower: string;
  assetClass: string;
  creditScore: string;
  principal: string;
  rateBps: string;
  tenorDays: string;
}

const GUARD = "Guard";

export function CreditDesk({ party }: { party: string }) {
  const [assetClass, setAssetClass] = useState("Trade receivables / invoices");
  const [principal, setPrincipal] = useState("1000000.0");
  const [rateBps, setRateBps] = useState("850");
  const [tenorDays, setTenorDays] = useState("90");
  const [requests, setRequests] = useState<Contract<LoanRequestPayload>[]>([]);
  const [status, setStatus] = useState("");

  async function refresh() {
    try {
      const rows = await ledger.query<LoanRequestPayload>(party, Templates.LoanRequest);
      setRequests(rows);
      setStatus(`Showing ${rows.length} funding request(s) visible to ${party}.`);
    } catch (e) {
      setStatus(`⚠ ${(e as Error).message} — is the JSON API running on :7575?`);
    }
  }

  async function fund(cid: string) {
    try {
      await ledger.exercise(party, Templates.LoanRequest, cid, "Fund", {
        lenderCred: {}, // in the real flow the lender's KycCredential is referenced
        fundedAt: new Date().toISOString(),
      });
      setStatus("✅ Funded against asset class + score — borrower identity stays private.");
      refresh();
    } catch (e) {
      setStatus(`⚠ ${(e as Error).message}`);
    }
  }

  return (
    <section className="desk">
      <div className="card">
        <h2>Confidential funding request</h2>
        <p className="muted">
          Borrower data stays off-ledger. A verifier ZK-attests validity + a
          privacy-preserving credit score; lenders fund the asset, not the name.
        </p>
        <div className="form-grid">
          <label>
            Asset class
            <input value={assetClass} onChange={(e) => setAssetClass(e.target.value)} />
          </label>
          <label>
            Principal
            <input value={principal} onChange={(e) => setPrincipal(e.target.value)} />
          </label>
          <label>
            Rate (bps)
            <input value={rateBps} onChange={(e) => setRateBps(e.target.value)} />
          </label>
          <label>
            Tenor (days)
            <input value={tenorDays} onChange={(e) => setTenorDays(e.target.value)} />
          </label>
        </div>
        <div className="proof-chip">
          ✔ revenue ≥ threshold &nbsp;✔ invoices valid &nbsp;✔ zero bankruptcies
          <span className="muted small"> — proven via zk, raw data never on-ledger</span>
        </div>
        <div className="actions">
          <button onClick={refresh}>Refresh my view</button>
        </div>
        {status && <p className="status">{status}</p>}
      </div>

      <div className="card">
        <h2>Fundable requests</h2>
        {requests.length === 0 ? (
          <p className="muted">No requests visible to {party}.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Asset class</th>
                <th>Score</th>
                <th>Principal</th>
                <th>Rate</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.contractId}>
                  <td>{r.payload.assetClass}</td>
                  <td>{r.payload.creditScore}</td>
                  <td>{r.payload.principal}</td>
                  <td>{r.payload.rateBps} bps</td>
                  <td>
                    <button className="primary small" onClick={() => fund(r.contractId)}>
                      Fund
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
