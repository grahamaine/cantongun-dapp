import { useState } from "react";
import { demo, T } from "../demoLedger";
import { useQuery, useVisible } from "../useLedger";

const LABELS: Record<string, string> = {
  KycCredential: "KYC credential",
  PrivateOrder: "Private order",
  SettlementProposal: "Settlement proposal",
  TradeReceipt: "Trade receipt",
  AssetAttestation: "ZK attestation",
  LoanRequest: "Loan request",
  Loan: "Loan",
  AuditRecord: "Disclosure",
};

export function ComplianceDesk({ party }: { party: string }) {
  const records = useQuery(party, T.AuditRecord);
  const visible = useVisible(party);
  const [status, setStatus] = useState("");

  // Group the party's entire entitled view by template — this IS the privacy story.
  const counts = visible.reduce<Record<string, number>>((acc, c) => {
    acc[c.template] = (acc[c.template] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="desk">
      <div className="card">
        <h2>Disclosure inbox</h2>
        <p className="muted">
          Selective disclosure is an explicit, signed act. Each record below was
          deliberately disclosed to <strong>{party}</strong> — and to no one else.
        </p>
        {records.length === 0 ? (
          <p className="muted">
            No disclosures to {party}. {party === "Regulator"
              ? "Ask a counterparty to disclose a trade or loan."
              : "Disclosures only appear for the named auditor."}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Reference</th>
                <th>From</th>
                <th>Commitment</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.contractId}>
                  <td>{r.payload.subject}</td>
                  <td>{r.payload.reference}</td>
                  <td>{r.payload.discloser}</td>
                  <td className="small muted">{r.payload.dataCommitment}</td>
                  <td>
                    {r.payload.auditor === party &&
                      (r.payload.acknowledged ? (
                        <span className="muted small">acknowledged</span>
                      ) : (
                        <button
                          className="small"
                          onClick={() => {
                            try {
                              demo.acknowledge(r.contractId, party);
                              setStatus("✅ Acknowledged for the regulatory sign-off trail.");
                            } catch (e) {
                              setStatus("⚠ " + (e as Error).message);
                            }
                          }}
                        >
                          Acknowledge
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {status && <p className="status">{status}</p>}
      </div>

      <div className="card">
        <h2>What {party} can see</h2>
        <p className="muted">
          The ledger only ships a contract to a party that is a stakeholder of it. This
          is {party}'s entire entitled view — everything else on the network is invisible.
        </p>
        {Object.keys(counts).length === 0 ? (
          <p className="muted">Nothing visible to {party} yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Contract type</th>
                <th>Visible to {party}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(counts).map(([tpl, n]) => (
                <tr key={tpl}>
                  <td>{LABELS[tpl] ?? tpl}</td>
                  <td>{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted small">
          Switch the “Acting as” party to watch the same ledger reveal a completely
          different view — that is Canton sub-transaction privacy, not access control.
        </p>
      </div>
    </section>
  );
}
