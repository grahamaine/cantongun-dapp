import { useState } from "react";
import { ledger, Templates, Contract } from "../ledger";

interface OrderPayload {
  trader: string;
  terms: { asset: string; quantity: string; side: "Buy" | "Sell"; limitPrice: string };
  submittedAt: string;
}

const GUARD = "Guard";

export function OtcDesk({ party }: { party: string }) {
  const [asset, setAsset] = useState("CantonGun 5Y Bond");
  const [quantity, setQuantity] = useState("10000");
  const [side, setSide] = useState<"Buy" | "Sell">("Sell");
  const [limitPrice, setLimitPrice] = useState("99.50");
  const [orders, setOrders] = useState<Contract<OrderPayload>[]>([]);
  const [status, setStatus] = useState<string>("");

  async function refresh() {
    try {
      const rows = await ledger.query<OrderPayload>(party, Templates.PrivateOrder);
      setOrders(rows);
      setStatus(`Showing ${rows.length} order(s) visible to ${party}.`);
    } catch (e) {
      setStatus(`⚠ ${(e as Error).message} — is the JSON API running on :7575?`);
    }
  }

  async function submitOrder() {
    try {
      await ledger.create<OrderPayload>(party, Templates.PrivateOrder, {
        trader: party,
        guard: GUARD,
        terms: { asset, quantity, side, limitPrice },
        submittedAt: new Date().toISOString(),
      } as unknown as OrderPayload);
      setStatus("✅ Private order submitted. No public order book — only the Guard sees it.");
      refresh();
    } catch (e) {
      setStatus(`⚠ ${(e as Error).message}`);
    }
  }

  return (
    <section className="desk">
      <div className="card">
        <h2>Submit confidential OTC order</h2>
        <p className="muted">
          Price &amp; identity stay in a contract shared only with the CantonGun Guard.
        </p>
        <div className="form-grid">
          <label>
            Instrument
            <input value={asset} onChange={(e) => setAsset(e.target.value)} />
          </label>
          <label>
            Quantity
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
          <label>
            Side
            <select value={side} onChange={(e) => setSide(e.target.value as "Buy" | "Sell")}>
              <option>Sell</option>
              <option>Buy</option>
            </select>
          </label>
          <label>
            Limit price
            <input value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} />
          </label>
        </div>
        <div className="actions">
          <button className="primary" onClick={submitOrder}>
            Submit private order
          </button>
          <button onClick={refresh}>Refresh my view</button>
        </div>
        {status && <p className="status">{status}</p>}
      </div>

      <div className="card">
        <h2>My private order book</h2>
        {orders.length === 0 ? (
          <p className="muted">No orders visible to {party}.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Side</th>
                <th>Qty</th>
                <th>Limit</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.contractId}>
                  <td>{o.payload.terms.asset}</td>
                  <td>{o.payload.terms.side}</td>
                  <td>{o.payload.terms.quantity}</td>
                  <td>{o.payload.terms.limitPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted small">
          The Guard matches crossing orders, both counterparties approve, and settlement
          is atomic &amp; confidential — then selectively disclosed to a regulator only.
        </p>
      </div>
    </section>
  );
}
