// In-browser demo ledger for CantonGun.
//
// Canton's defining property is sub-transaction privacy: a contract is only ever
// distributed to its signatory and observer parties. There is no global view.
//
// This module simulates exactly that on the client so the product is fully
// demoable without a running Canton participant. Every stored contract carries the
// set of parties entitled to see it (`stakeholders`), and `query` for a party
// returns ONLY the contracts that party is a stakeholder of — the same boundary the
// real Daml JSON API enforces. The choice logic below mirrors the templates in
// `daml/CantonGun/*.daml`; the Daml model remains the source of truth.

export type Role = "Trader" | "Borrower" | "Lender" | "Verifier";
export type Side = "Buy" | "Sell";

// Bare template names used by the in-browser demo store. (The live JSON-API client in
// ledger.ts uses the fully-qualified `#cantongun:Module:Entity` ids.)
export const T = {
  KycCredential: "KycCredential",
  PrivateOrder: "PrivateOrder",
  SettlementProposal: "SettlementProposal",
  TradeReceipt: "TradeReceipt",
  AssetAttestation: "AssetAttestation",
  LoanRequest: "LoanRequest",
  Loan: "Loan",
  AuditRecord: "AuditRecord",
} as const;

export interface DemoContract {
  contractId: string;
  template: string;
  // Parties entitled to see this contract (signatories + observers).
  stakeholders: string[];
  payload: Record<string, any>;
  archived?: boolean;
}

export interface KycPayload {
  guard: string;
  holder: string;
  legalName: string;
  role: Role;
  kycCommitment: string;
}

const GUARD = "Guard";

let seq = 0;
const cid = (t: string) => `${t}#${(++seq).toString().padStart(4, "0")}`;

// ---- store -----------------------------------------------------------------

let store: DemoContract[] = [];
type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());
export const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function add(template: string, stakeholders: string[], payload: Record<string, any>) {
  const c: DemoContract = { contractId: cid(template), template, stakeholders, payload };
  store.push(c);
  return c;
}
function find(contractId: string) {
  const c = store.find((x) => x.contractId === contractId && !x.archived);
  if (!c) throw new Error(`contract ${contractId} not found or archived`);
  return c;
}
function archive(c: DemoContract) {
  c.archived = true;
}

/** Active contracts of a template that `party` is entitled to see. THE privacy gate. */
export function query(party: string, template: string): DemoContract[] {
  return store.filter(
    (c) => !c.archived && c.template === template && c.stakeholders.includes(party)
  );
}

/** Everything a party can see, across all templates — for the "what I see" panel. */
export function visibleToParty(party: string): DemoContract[] {
  return store.filter((c) => !c.archived && c.stakeholders.includes(party));
}

// ---- identity --------------------------------------------------------------

const credsByParty = new Map<string, KycPayload>();
export function issueKyc(holder: string, legalName: string, role: Role) {
  const payload: KycPayload = {
    guard: GUARD,
    holder,
    legalName,
    role,
    kycCommitment: `sha256:${legalName}`,
  };
  credsByParty.set(holder, payload);
  add("KycCredential", [GUARD, holder], payload);
  return payload;
}
function requireRole(party: string, role: Role) {
  const cred = credsByParty.get(party);
  if (!cred || cred.role !== role)
    throw new Error(`${party} is not KYC'd as ${role} — onboarding required`);
  return cred;
}

// ---- OTC --------------------------------------------------------------------

export function submitOrder(
  trader: string,
  terms: { asset: string; quantity: number; side: Side; limitPrice: number }
) {
  requireRole(trader, "Trader");
  if (terms.quantity <= 0 || terms.limitPrice <= 0) throw new Error("invalid terms");
  // Signatory: trader. Observer: Guard only. No competitor ever sees it.
  return add("PrivateOrder", [trader, GUARD], {
    trader,
    guard: GUARD,
    terms,
    submittedAt: new Date().toISOString(),
  });
}

/** Guard-run confidential matching. Mirrors PrivateOrder.ProposeMatch. */
export function proposeMatch(sellCid: string, buyCid: string, clearingPrice: number) {
  const sell = find(sellCid);
  const buy = find(buyCid);
  const s = sell.payload.terms;
  const b = buy.payload.terms;
  if (s.asset !== b.asset) throw new Error("asset mismatch");
  if (s.side === b.side) throw new Error("orders are the same side");
  if (s.quantity !== b.quantity) throw new Error("quantity mismatch");
  const seller = s.side === "Sell" ? sell : buy;
  const buyer = s.side === "Buy" ? sell : buy;
  if (!(seller.payload.terms.limitPrice <= clearingPrice && clearingPrice <= buyer.payload.terms.limitPrice))
    throw new Error("orders do not cross at this clearing price");

  // Settlement visible only to the two counterparties + Guard.
  const prop = add("SettlementProposal", [buyer.payload.trader, seller.payload.trader, GUARD], {
    guard: GUARD,
    buyer: buyer.payload.trader,
    seller: seller.payload.trader,
    asset: s.asset,
    quantity: s.quantity,
    clearingPrice,
    buyerApproved: false,
    sellerApproved: false,
  });
  archive(sell);
  archive(buy);
  return prop;
}

export function approve(proposalCid: string, approver: string) {
  const p = find(proposalCid);
  if (approver !== p.payload.buyer && approver !== p.payload.seller)
    throw new Error("not a counterparty to this settlement");
  if (approver === p.payload.buyer) p.payload.buyerApproved = true;
  if (approver === p.payload.seller) p.payload.sellerApproved = true;
  return p;
}

export function settle(proposalCid: string) {
  const p = find(proposalCid);
  if (!(p.payload.buyerApproved && p.payload.sellerApproved))
    throw new Error("both counterparties must approve before settlement");
  archive(p);
  return add("TradeReceipt", [p.payload.buyer, p.payload.seller, GUARD], {
    guard: GUARD,
    buyer: p.payload.buyer,
    seller: p.payload.seller,
    asset: p.payload.asset,
    quantity: p.payload.quantity,
    clearingPrice: p.payload.clearingPrice,
    notional: p.payload.quantity * p.payload.clearingPrice,
  });
}

// ---- Credit -----------------------------------------------------------------

export function attestAsset(
  verifier: string,
  borrower: string,
  facts: {
    assetClass: string;
    revenueAboveThresh: boolean;
    invoicesValid: boolean;
    zeroBankruptcies: boolean;
    creditScore: number;
  }
) {
  requireRole(verifier, "Verifier");
  if (facts.creditScore < 0 || facts.creditScore > 1000) throw new Error("score out of range");
  return add("AssetAttestation", [verifier, borrower], {
    verifier,
    borrower,
    ...facts,
    evidenceCommitment: `zk:invoices-${Math.random().toString(36).slice(2, 8)}`,
    issuedAt: new Date().toISOString(),
  });
}

export function createLoanRequest(
  borrower: string,
  req: {
    attestationCid: string;
    assetClass: string;
    creditScore: number;
    principal: number;
    rateBps: number;
    tenorDays: number;
  }
) {
  requireRole(borrower, "Borrower");
  const att = find(req.attestationCid);
  if (att.payload.borrower !== borrower) throw new Error("attestation is not for this borrower");
  if (req.principal <= 0 || req.tenorDays <= 0) throw new Error("invalid loan terms");
  // Borrower + Guard see it. Guard syndicates to lenders by adding them as observers.
  return add("LoanRequest", [borrower, GUARD], {
    borrower,
    guard: GUARD,
    assetClass: req.assetClass,
    creditScore: req.creditScore,
    principal: req.principal,
    rateBps: req.rateBps,
    tenorDays: req.tenorDays,
    attestationCid: req.attestationCid,
  });
}

/** Guard syndicates a request to a chosen lender (adds them as an observer). */
export function syndicate(requestCid: string, lender: string) {
  const r = find(requestCid);
  if (!r.stakeholders.includes(lender)) r.stakeholders.push(lender);
  return r;
}

export function fund(requestCid: string, lender: string) {
  requireRole(lender, "Lender");
  const r = find(requestCid);
  archive(r);
  // Loan visible only to borrower, lender, Guard.
  return add("Loan", [r.payload.borrower, lender, GUARD], {
    borrower: r.payload.borrower,
    lender,
    guard: GUARD,
    assetClass: r.payload.assetClass,
    principal: r.payload.principal,
    rateBps: r.payload.rateBps,
    tenorDays: r.payload.tenorDays,
    outstanding: r.payload.principal,
    fundedAt: new Date().toISOString(),
  });
}

export function repay(loanCid: string, amount: number) {
  const l = find(loanCid);
  if (amount <= 0) throw new Error("amount must be positive");
  if (amount > l.payload.outstanding) throw new Error("overpayment");
  l.payload.outstanding = +(l.payload.outstanding - amount).toFixed(2);
  return l;
}

export function closeLoan(loanCid: string) {
  const l = find(loanCid);
  if (l.payload.outstanding !== 0) throw new Error("balance still outstanding");
  archive(l);
  return l;
}

// ---- Audit / selective disclosure ------------------------------------------

export function disclose(
  discloser: string,
  auditor: string,
  subject: string,
  reference: string,
  dataCommitment: string
) {
  // Visible ONLY to discloser + the chosen auditor. Competitors never see it.
  return add("AuditRecord", [discloser, auditor], {
    discloser,
    auditor,
    subject,
    reference,
    dataCommitment,
    disclosedAt: new Date().toISOString(),
    acknowledged: false,
  });
}

export function acknowledge(recordCid: string, auditor: string) {
  const r = find(recordCid);
  if (r.payload.auditor !== auditor) throw new Error("only the named auditor may acknowledge");
  r.payload.acknowledged = true;
  return r;
}

// ---- seed -------------------------------------------------------------------

/** Idempotent demo seed: onboards the cast so the desks have something to act on. */
export function ensureSeeded() {
  if (store.length > 0) return;
  issueKyc("BankA", "Bank A (London desk)", "Trader");
  issueKyc("BankB", "Bank B (NY desk)", "Trader");
  issueKyc("Logistics", "Canton Logistics Ltd", "Borrower");
  issueKyc("Fund", "Canton Capital Fund", "Lender");
  issueKyc("Verifier", "KPMG Trade Verifier", "Verifier");
  emit();
}

export function resetDemo() {
  store = [];
  credsByParty.clear();
  seq = 0;
  ensureSeeded();
  emit();
}

// Wrap mutators so the UI re-renders after every ledger change.
function withEmit<A extends any[], R>(fn: (...a: A) => R): (...a: A) => R {
  return (...a: A) => {
    const r = fn(...a);
    emit();
    return r;
  };
}

export const demo = {
  query,
  visibleToParty,
  subscribe,
  ensureSeeded,
  resetDemo,
  credFor: (p: string) => credsByParty.get(p),
  submitOrder: withEmit(submitOrder),
  proposeMatch: withEmit(proposeMatch),
  approve: withEmit(approve),
  settle: withEmit(settle),
  attestAsset: withEmit(attestAsset),
  createLoanRequest: withEmit(createLoanRequest),
  syndicate: withEmit(syndicate),
  fund: withEmit(fund),
  repay: withEmit(repay),
  closeLoan: withEmit(closeLoan),
  disclose: withEmit(disclose),
  acknowledge: withEmit(acknowledge),
};
