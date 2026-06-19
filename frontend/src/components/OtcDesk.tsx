import { useMemo, useState } from "react";
import { demo, Side, T } from "../demoLedger";
import { useQuery } from "../useLedger";

export function OtcDesk({ party }: { party: string }) {
  const isGuard = party === "Guard";
  const orders = useQuery(party, T.PrivateOrder);
  const proposals = useQuery(party, T.SettlementProposal);
  const receipts = useQuery(party, T.TradeReceipt);

  const [asset, setAsset] = useState("CantonGun 5Y Bond");
  const [quantity, setQuantity] = useState("10000");
  const [side, setSide] = useState<Side>("Sell");
  const [limitPrice, setLimitPrice] = useState("99.50");
  const [status, setStatus] = useState("");

  // Guard matching console state.
  const [sellSel, setSellSel] = useState("");
  const [buySel, setBuySel] = useState("");
  const [clearing, setClearing] = useState("99.75");

  const ok = (m: string) => setStatus("✅ " + m);
  const err = (e: unknown) => setStatus("⚠ " + (e as Error).message);

  function submit() {
    try {
      demo.submitOrder(party, {
        asset,
        quantity: parseInt(quantity, 10),
        side,
        limitPrice: parseFloat(limitPrice),
      });
      ok("Private order submitted. No public order book — only the Guard sees it.");
    } catch (e) {
      err(e);
    }
  }

  const sells = useMemo(() => orders.filter((o) => o.payload.terms.side === "Sell"), [orders]);
  const buys = useMemo(() => orders.filter((o) => o.payload.terms.side === "Buy"), [orders]);

  function match() {
    try {
      demo.proposeMatch(sellSel, buySel, parseFloat(clearing));
      ok("Confidential match proposed. Counterparties must both approve to settle.");
    } catch (e) {
      err(e);
    }
  }

  return (
    <section className="desk">
      {!isGuard && (
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
              <select value={side} onChange={(e) => setSide(e.target.value as Side)}>
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
            <button className="primary" onClick={submit}>
              Submit private order
            </button>
          </div>
          {status && <p className="status">{status}</p>}
        </div>
      )}

      {isGuard && (
        <div className="card">
          <h2>Guard matching console</h2>
          <p className="muted">
            The Guard is the only party that can see crossing orders from different desks
            — and runs confidential matching. Neither bank sees the other's order.
          </p>
          <div className="form-grid">
            <label>
              Sell order
              <select value={sellSel} onChange={(e) => setSellSel(e.target.value)}>
                <option value="">— select —</option>
                {sells.map((o) => (
                  <option key={o.contractId} value={o.contractId}>
                    {o.payload.trader} · {o.payload.terms.quantity} {o.payload.terms.asset} @{" "}
                    {o.payload.terms.limitPrice}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Buy order
              <select value={buySel} onChange={(e) => setBuySel(e.target.value)}>
                <option value="">— select —</option>
                {buys.map((o) => (
                  <option key={o.contractId} value={o.contractId}>
                    {o.payload.trader} · {o.payload.terms.quantity} {o.payload.terms.asset} @{" "}
                    {o.payload.terms.limitPrice}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Clearing price
              <input value={clearing} onChange={(e) => setClearing(e.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button className="primary" onClick={match} disabled={!sellSel || !buySel}>
              Propose confidential match
            </button>
          </div>
          {status && <p className="status">{status}</p>}
        </div>
      )}

      <div className="card">
        <h2>{isGuard ? "Orders awaiting matching" : "My private order book"}</h2>
        {orders.length === 0 ? (
          <p className="muted">No orders visible to {party}.</p>
        ) : (
          <table>
            <thead>
              <tr>
                {isGuard && <th>Trader</th>}
                <th>Instrument</th>
                <th>Side</th>
                <th>Qty</th>
                <th>Limit</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.contractId}>
                  {isGuard && <td>{o.payload.trader}</td>}
                  <td>{o.payload.terms.asset}</td>
                  <td>{o.payload.terms.side}</td>
                  <td>{o.payload.terms.quantity}</td>
                  <td>{o.payload.terms.limitPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {proposals.length > 0 && (
        <div className="card">
          <h2>Settlement proposals (confidential)</h2>
          <table>
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Qty</th>
                <th>Clearing</th>
                <th>Buyer</th>
                <th>Seller</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => {
                const pd = p.payload;
                const both = pd.buyerApproved && pd.sellerApproved;
                return (
                  <tr key={p.contractId}>
                    <td>{pd.asset}</td>
                    <td>{pd.quantity}</td>
                    <td>{pd.clearingPrice}</td>
                    <td>{pd.buyer} {pd.buyerApproved ? "✓" : ""}</td>
                    <td>{pd.seller} {pd.sellerApproved ? "✓" : ""}</td>
                    <td>
                      {!isGuard && (party === pd.buyer || party === pd.seller) && (
                        <button
                          className="small"
                          onClick={() => {
                            try {
                              demo.approve(p.contractId, party);
                              ok("Approved. Settlement is atomic once both sides sign.");
                            } catch (e) {
                              err(e);
                            }
                          }}
                        >
                          Approve
                        </button>
                      )}
                      {isGuard && (
                        <button
                          className="primary small"
                          disabled={!both}
                          onClick={() => {
                            try {
                              demo.settle(p.contractId);
                              ok("Settled atomically & confidentially. Receipts issued.");
                            } catch (e) {
                              err(e);
                            }
                          }}
                        >
                          Settle
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {receipts.length > 0 && (
        <div className="card">
          <h2>Settled trades (private receipts)</h2>
          <table>
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Notional</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.contractId}>
                  <td>{r.payload.asset}</td>
                  <td>{r.payload.quantity}</td>
                  <td>{r.payload.clearingPrice}</td>
                  <td>{r.payload.notional.toLocaleString()}</td>
                  <td>
                    {(party === r.payload.buyer || party === r.payload.seller) && (
                      <button
                        className="small"
                        onClick={() => {
                          try {
                            demo.disclose(
                              party,
                              "Regulator",
                              "OTC trade",
                              r.payload.asset,
                              `zk:trade-${r.contractId}`
                            );
                            ok("Disclosed to Regulator only — competitors see nothing.");
                          } catch (e) {
                            err(e);
                          }
                        }}
                      >
                        Disclose to Regulator
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
