# CantonGun Frontend

Institutional UI for the CantonGun confidential capital-markets DApp.

```bash
npm install
npm run dev        # http://localhost:3000
```

The dev server proxies `/v1` to the Daml JSON API on `http://localhost:7575`
(start it from the repo root with `./scripts/start-ledger.sh` or `daml start`).

## How privacy shows up in the UI
- The **"Acting as"** picker switches the party you authenticate as. The JSON API only
  returns contracts that party is entitled to see — switch from `BankA` to `Fund` and
  the OTC orders vanish, because the ledger never shares them.
- `src/ledger.ts` is a thin JSON-API client (query / create / exercise) with a
  per-party dev token.
- `components/OtcDesk.tsx` — submit confidential orders into a private order book.
- `components/CreditDesk.tsx` — post/fund confidential invoice-financing requests with
  zk-attested validity.

> Tokens here are unsigned dev tokens for `daml start`. For any shared/hosted
> deployment, issue real signed JWTs per party.
