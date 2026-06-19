import { useState } from "react";
import { demo, T } from "../demoLedger";
import { useQuery } from "../useLedger";

export function CreditDesk({ party }: { party: string }) {
  const isGuard = party === "Guard";
  const role = demo.credFor(party)?.role;
  const attestations = useQuery(party, T.AssetAttestation);
  const requests = useQuery(party, T.LoanRequest);
  const loans = useQuery(party, T.Loan);

  const [status, setStatus] = useState("");
  const ok = (m: string) => setStatus("✅ " + m);
  const err = (e: unknown) => setStatus("⚠ " + (e as Error).message);

  // Verifier form.
  const [borrower, setBorrower] = useState("Logistics");
  const [score, setScore] = useState("780");

  // Borrower request form.
  const [attCid, setAttCid] = useState("");
  const [principal, setPrincipal] = useState("1000000");
  const [rateBps, setRateBps] = useState("850");
  const [tenorDays, setTenorDays] = useState("90");

  // Guard syndication.
  const [lenderSel, setLenderSel] = useState("Fund");

  const [repayAmt, setRepayAmt] = useState("400000");

  return (
    <section className="desk">
      {role === "Verifier" && (
        <div className="card">
          <h2>ZK asset attestation</h2>
          <p className="muted">
            You vouch for the borrower's off-ledger invoices. Only the proven facts +
            a privacy-preserving score go on-ledger — never the raw data.
          </p>
          <div className="form-grid">
            <label>
              Borrower
              <select value={borrower} onChange={(e) => setBorrower(e.target.value)}>
                <option>Logistics</option>
              </select>
            </label>
            <label>
              Credit score
              <input value={score} onChange={(e) => setScore(e.target.value)} />
            </label>
          </div>
          <div className="proof-chip">
            ✔ revenue ≥ threshold &nbsp;✔ invoices valid &nbsp;✔ zero bankruptcies
          </div>
          <div className="actions">
            <button
              className="primary"
              onClick={() => {
                try {
                  demo.attestAsset(party, borrower, {
                    assetClass: "Trade receivables / invoices",
                    revenueAboveThresh: true,
                    invoicesValid: true,
                    zeroBankruptcies: true,
                    creditScore: parseInt(score, 10),
                  });
                  ok("Attestation issued. The proof is on-ledger; the data never is.");
                } catch (e) {
                  err(e);
                }
              }}
            >
              Issue ZK attestation
            </button>
          </div>
          {status && <p className="status">{status}</p>}
        </div>
      )}

      {role === "Borrower" && (
        <div className="card">
          <h2>Confidential funding request</h2>
          <p className="muted">
            Your identity and financials stay private. Lenders see the asset class and
            attested score — not your name or your customers.
          </p>
          <div className="form-grid">
            <label>
              Attestation
              <select value={attCid} onChange={(e) => setAttCid(e.target.value)}>
                <option value="">— select —</option>
                {attestations.map((a) => (
                  <option key={a.contractId} value={a.contractId}>
                    score {a.payload.creditScore} · {a.payload.assetClass}
                  </option>
                ))}
              </select>
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
          <div className="actions">
            <button
              className="primary"
              disabled={!attCid}
              onClick={() => {
                try {
                  const att = attestations.find((a) => a.contractId === attCid)!;
                  demo.createLoanRequest(party, {
                    attestationCid: attCid,
                    assetClass: att.payload.assetClass,
                    creditScore: att.payload.creditScore,
                    principal: parseFloat(principal),
                    rateBps: parseInt(rateBps, 10),
                    tenorDays: parseInt(tenorDays, 10),
                  });
                  ok("Request posted to the Guard for confidential syndication.");
                } catch (e) {
                  err(e);
                }
              }}
            >
              Post funding request
            </button>
          </div>
          {status && <p className="status">{status}</p>}
        </div>
      )}

      <div className="card">
        <h2>{isGuard ? "Requests to syndicate" : "Fundable requests"}</h2>
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
                <th>Tenor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.contractId}>
                  <td>{r.payload.assetClass}</td>
                  <td>{r.payload.creditScore}</td>
                  <td>{r.payload.principal.toLocaleString()}</td>
                  <td>{r.payload.rateBps} bps</td>
                  <td>{r.payload.tenorDays}d</td>
                  <td>
                    {isGuard && (
                      <div className="actions">
                        <select value={lenderSel} onChange={(e) => setLenderSel(e.target.value)}>
                          <option>Fund</option>
                        </select>
                        <button
                          className="small"
                          onClick={() => {
                            try {
                              demo.syndicate(r.contractId, lenderSel);
                              ok(`Syndicated to ${lenderSel} — they can now see the request.`);
                            } catch (e) {
                              err(e);
                            }
                          }}
                        >
                          Syndicate
                        </button>
                      </div>
                    )}
                    {role === "Lender" && (
                      <button
                        className="primary small"
                        onClick={() => {
                          try {
                            demo.fund(r.contractId, party);
                            ok("Funded against asset + score — borrower identity stays private.");
                          } catch (e) {
                            err(e);
                          }
                        }}
                      >
                        Fund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {isGuard && status && <p className="status">{status}</p>}
        {role === "Lender" && status && <p className="status">{status}</p>}
      </div>

      {loans.length > 0 && (
        <div className="card">
          <h2>Serviced loans (private)</h2>
          <table>
            <thead>
              <tr>
                <th>Asset class</th>
                <th>Principal</th>
                <th>Outstanding</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.contractId}>
                  <td>{l.payload.assetClass}</td>
                  <td>{l.payload.principal.toLocaleString()}</td>
                  <td>{l.payload.outstanding.toLocaleString()}</td>
                  <td>
                    <div className="actions">
                      {role === "Borrower" && l.payload.outstanding > 0 && (
                        <>
                          <input
                            style={{ width: 90 }}
                            value={repayAmt}
                            onChange={(e) => setRepayAmt(e.target.value)}
                          />
                          <button
                            className="small"
                            onClick={() => {
                              try {
                                demo.repay(l.contractId, parseFloat(repayAmt));
                                ok("Confidential repayment recorded.");
                              } catch (e) {
                                err(e);
                              }
                            }}
                          >
                            Repay
                          </button>
                        </>
                      )}
                      {role === "Lender" && l.payload.outstanding === 0 && (
                        <button
                          className="primary small"
                          onClick={() => {
                            try {
                              demo.closeLoan(l.contractId);
                              ok("Loan closed.");
                            } catch (e) {
                              err(e);
                            }
                          }}
                        >
                          Close
                        </button>
                      )}
                      {(role === "Borrower" || role === "Lender") && (
                        <button
                          className="small"
                          onClick={() => {
                            try {
                              demo.disclose(
                                party,
                                "Regulator",
                                "InvoiceLoan",
                                l.payload.assetClass,
                                `zk:loan-${l.contractId}`
                              );
                              ok("Disclosed to Regulator only.");
                            } catch (e) {
                              err(e);
                            }
                          }}
                        >
                          Disclose
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(role === "Borrower" || role === "Lender") && status && (
            <p className="status">{status}</p>
          )}
        </div>
      )}
    </section>
  );
}
