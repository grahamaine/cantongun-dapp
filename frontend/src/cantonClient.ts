// Live Canton ledger client (Canton Network wallet SDK).
//
// This is the production counterpart to `demoLedger.ts`. It talks to a real Canton
// participant via @canton-network/wallet-sdk: it allocates parties, submits Daml
// commands (create / exercise on the deployed `cantongun` DAR) and reads the active
// contract set. Privacy is enforced by Canton itself — `acs.read({ parties })` only
// ever returns contracts the acting party is a stakeholder of, the same boundary the
// demo ledger simulates.
//
// Requires: a running Canton stack (e.g. LocalNet) reachable at LEDGER_CLIENT_URL,
// with the cantongun DAR uploaded. See cantonConfig.ts / .env.example. This module is
// only imported when VITE_LEDGER_MODE=live, so the demo build never pulls the SDK.

import { SDK } from "@canton-network/wallet-sdk";
import { AUTH, LEDGER_CLIENT_URL, PACKAGE_ID, SYNCHRONIZER_ID } from "./cantonConfig";

type Sdk = Awaited<ReturnType<typeof SDK.create>>;

// Fully-qualified template ids on the deployed DAR.
export const Live = {
  KycCredential: `${PACKAGE_ID}:CantonGun.Identity:KycCredential`,
  PrivateOrder: `${PACKAGE_ID}:CantonGun.OTC:PrivateOrder`,
  SettlementProposal: `${PACKAGE_ID}:CantonGun.OTC:SettlementProposal`,
  TradeReceipt: `${PACKAGE_ID}:CantonGun.OTC:TradeReceipt`,
  AssetAttestation: `${PACKAGE_ID}:CantonGun.Credit:AssetAttestation`,
  LoanRequest: `${PACKAGE_ID}:CantonGun.Credit:LoanRequest`,
  Loan: `${PACKAGE_ID}:CantonGun.Credit:Loan`,
  AuditRecord: `${PACKAGE_ID}:CantonGun.Audit:AuditRecord`,
} as const;

let sdkPromise: Promise<Sdk> | null = null;

/** Lazily create and memoise the SDK connection. */
export function getSdk(): Promise<Sdk> {
  if (!sdkPromise) {
    sdkPromise = SDK.create({
      auth: AUTH,
      ledgerClientUrl: LEDGER_CLIENT_URL,
    });
  }
  return sdkPromise;
}

// ---- parties ----------------------------------------------------------------

interface PartyKeys {
  partyId: string;
  privateKey: string;
}

// Maps a friendly label ("BankA") to its allocated party id + signing key. In a real
// multi-institution deployment each party's key lives in its own wallet; here we hold
// them client-side for the demo. Keys never leave the browser.
const parties = new Map<string, PartyKeys>();

/**
 * Allocate (or reuse) an external party for a label. We generate a keypair, create the
 * external party bound to its public key, and keep the private key to sign that party's
 * transactions — the interactive-submission model the SDK exposes. This mirrors how each
 * institution would hold its own keys: a contract is only ever signed by its stakeholders.
 */
export async function ensureParty(label: string): Promise<PartyKeys> {
  const cached = parties.get(label);
  if (cached) return cached;
  const sdk = await getSdk();
  const { publicKey, privateKey } = sdk.keys.generate();
  const created = await sdk.party.external
    .create(publicKey, { partyHint: label })
    .sign(privateKey)
    .execute({ grantUserRights: true });
  const entry: PartyKeys = { partyId: created.partyId, privateKey };
  parties.set(label, entry);
  return entry;
}

// ---- generic command submission --------------------------------------------

export interface LiveContract<T = Record<string, unknown>> {
  contractId: string;
  templateId: string;
  payload: T;
}

/** Submit one or more Daml commands as `partyLabel`: prepare → sign → execute. */
async function submit(partyLabel: string, commands: unknown): Promise<void> {
  const sdk = await getSdk();
  const { partyId, privateKey } = await ensureParty(partyLabel);
  const prepared = sdk.ledger.prepare({
    partyId,
    commands,
    ...(SYNCHRONIZER_ID ? { synchronizerId: SYNCHRONIZER_ID } : {}),
  });
  const signed = prepared.sign(privateKey);
  await sdk.ledger.execute(signed, { partyId });
}

/** Create a contract of `templateId` with `payload`, acting as `partyLabel`. */
export async function create(
  partyLabel: string,
  templateId: string,
  payload: Record<string, unknown>
): Promise<void> {
  await submit(partyLabel, {
    CreateCommand: { templateId, createArguments: payload },
  });
}

/** Exercise `choice` on `contractId` of `templateId`, acting as `partyLabel`. */
export async function exercise(
  partyLabel: string,
  templateId: string,
  contractId: string,
  choice: string,
  choiceArgument: Record<string, unknown> = {}
): Promise<void> {
  await submit(partyLabel, {
    ExerciseCommand: { templateId, contractId, choice, choiceArgument },
  });
}

/** Active contracts of a template visible to `partyLabel` — privacy by construction. */
export async function query<T = Record<string, unknown>>(
  partyLabel: string,
  templateId: string
): Promise<LiveContract<T>[]> {
  const sdk = await getSdk();
  const { partyId } = await ensureParty(partyLabel);
  const rows = await sdk.ledger.acs.read({
    parties: [partyId],
    templateIds: [templateId],
    filterByParty: true,
  });
  return rows.map((r) => ({
    contractId: r.contractId,
    templateId: r.templateId,
    payload: r.createArgument as T,
  }));
}
