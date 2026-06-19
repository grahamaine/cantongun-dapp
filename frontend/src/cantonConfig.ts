// Configuration for the live Canton path (wallet SDK).
//
// All values are env-driven so the same build runs against a LocalNet, a shared
// dev net, or a production participant. Copy `.env.example` to `.env` to override.
//
// The defaults below match a Canton LocalNet with the `self_signed` "unsafe-auth"
// dev issuer — DO NOT use these against any real deployment.

import type { TokenProviderConfig } from "@canton-network/wallet-sdk";

const env = import.meta.env as Record<string, string | undefined>;

/** "demo" = in-browser simulated ledger; "live" = real Canton via the wallet SDK. */
export const LEDGER_MODE: "demo" | "live" =
  (env.VITE_LEDGER_MODE as "demo" | "live") ?? "demo";

/** JSON Ledger API endpoint of the participant the dApp talks to. */
export const LEDGER_CLIENT_URL =
  env.VITE_LEDGER_CLIENT_URL ?? "http://localhost:6201";

/** Optional explicit synchronizer (sync domain) id; auto-detected if unset. */
export const SYNCHRONIZER_ID = env.VITE_SYNCHRONIZER_ID || undefined;

/**
 * Package id of the deployed `cantongun` DAR. After `daml build` + DAR upload,
 * Canton can resolve the package-name alias `#cantongun`, so that is the default.
 * Pin an explicit hash via VITE_CANTONGUN_PACKAGE_ID for reproducible template ids.
 */
export const PACKAGE_ID = env.VITE_CANTONGUN_PACKAGE_ID ?? "#cantongun";

/**
 * Dev auth: LocalNet's self-signed "unsafe-auth" issuer. Override every field via
 * env for any non-local environment (and never ship the unsafe secret).
 */
export const AUTH: TokenProviderConfig = {
  method: "self_signed",
  issuer: env.VITE_AUTH_ISSUER ?? "unsafe-auth",
  credentials: {
    clientId: env.VITE_AUTH_CLIENT_ID ?? "ledger-api-user",
    clientSecret: env.VITE_AUTH_CLIENT_SECRET ?? "unsafe",
    audience: env.VITE_AUTH_AUDIENCE ?? "https://canton.network.global",
    scope: env.VITE_AUTH_SCOPE ?? "",
  },
};
