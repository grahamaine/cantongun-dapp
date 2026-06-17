// Thin client for the Daml JSON API (privacy-aware ledger).
//
// Each session authenticates as a single party. The JSON API only ever returns
// contracts that party is entitled to see — so confidentiality is enforced by the
// ledger, not by this client.

const JSON_API = "/v1";

// Template ids — `<package-id>:Module:Entity`. With `daml start` you can use the
// package name alias (`#cantongun`) instead of a hash.
const PKG = "#cantongun";
export const Templates = {
  KycCredential: `${PKG}:CantonGun.Identity:KycCredential`,
  PrivateOrder: `${PKG}:CantonGun.OTC:PrivateOrder`,
  SettlementProposal: `${PKG}:CantonGun.OTC:SettlementProposal`,
  TradeReceipt: `${PKG}:CantonGun.OTC:TradeReceipt`,
  LoanRequest: `${PKG}:CantonGun.Credit:LoanRequest`,
  Loan: `${PKG}:CantonGun.Credit:Loan`,
  AuditRecord: `${PKG}:CantonGun.Audit:AuditRecord`,
} as const;

export interface Contract<T = Record<string, unknown>> {
  contractId: string;
  templateId: string;
  payload: T;
}

// In local dev `daml start` issues unsigned tokens; the party name IS the subject.
function tokenFor(party: string): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const claims = btoa(
    JSON.stringify({
      "https://daml.com/ledger-api": {
        ledgerId: "sandbox",
        applicationId: "cantongun",
        actAs: [party],
        readAs: [party],
      },
    })
  );
  return `${header}.${claims}.`;
}

async function call<T>(party: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${JSON_API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenFor(party)}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.status !== 200) {
    throw new Error(json.errors?.join(", ") ?? `ledger error (${json.status})`);
  }
  return json.result as T;
}

export const ledger = {
  /** Query active contracts of a template this party can see. */
  query<T>(party: string, templateId: string): Promise<Contract<T>[]> {
    return call<Contract<T>[]>(party, "/query", { templateIds: [templateId] });
  },

  /** Create a contract as this party. */
  create<T>(party: string, templateId: string, payload: T): Promise<Contract<T>> {
    return call<Contract<T>>(party, "/create", { templateId, payload });
  },

  /** Exercise a choice on a contract. */
  exercise<R>(
    party: string,
    templateId: string,
    contractId: string,
    choice: string,
    argument: Record<string, unknown> = {}
  ): Promise<R> {
    return call<R>(party, "/exercise", { templateId, contractId, choice, argument });
  },
};
