import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type OAuthResult = {
  redirect_url?: string;
  redirect_to?: string;
  client?: { name?: string; client_name?: string; redirect_uri?: string };
  scope?: string;
};

type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: OAuthResult | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: OAuthResult | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: OAuthResult | null; error: { message: string } | null }>;
};

const oauthApi = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s['authorization_id'] === "string" ? s['authorization_id'] : "",
  }),
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md p-8">
      Unable to load the connection request: {String((error as Error)?.message ?? error)}
    </main>
  ),
});

function Consent() {
  const { authorization_id } = Route.useSearch();
  const [email, setEmail] = useState<string | null>(null);
  const [details, setDetails] = useState<OAuthResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!authorization_id) {
        setError("Missing authorization_id.");
        setLoading(false);
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!sessionData.session) {
        setLoading(false);
        return;
      }
      setEmail(sessionData.session.user.email ?? null);
      const { data, error: err } = await oauthApi().getAuthorizationDetails(authorization_id);
      if (cancelled) return;
      if (err) setError(err.message);
      else {
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [authorization_id]);

  async function signIn() {
    setBusy(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.href,
    });
    if (result.error) {
      setError(String(result.error));
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    window.location.reload();
  }

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error: err } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setError("The authorization server did not return a redirect address.");
      setBusy(false);
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "this application";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="surface w-full max-w-md rounded-3xl p-8 shadow-lg">
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !email ? (
          <>
            <h1 className="text-xl font-semibold">Connect with MindSeed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to MindSeed to grant an external application permission.
            </p>
            {error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <button
              disabled={busy}
              onClick={signIn}
              className="mt-6 w-full rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60"
            >
              Sign in with Google
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">Connect {clientName} to MindSeed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {clientName} will be able to call MindSeed tools on your behalf.
            </p>
            <p className="mt-4 text-sm">
              Signed in as: <span className="font-medium">{email}</span>
            </p>
            {details?.client?.redirect_uri && (
              <p className="mt-1 break-all text-xs text-muted-foreground">
                Redirecting to: {details.client.redirect_uri}
              </p>
            )}
            {details?.scope && (
              <p className="mt-1 text-xs text-muted-foreground">Requested scopes: {details.scope}</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              This does not bypass MindSeed’s security rules.
            </p>
            {error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                disabled={busy}
                onClick={() => decide(true)}
                className="flex-1 rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60"
              >
                Approve
              </button>
              <button
                disabled={busy}
                onClick={() => decide(false)}
                className="flex-1 rounded-2xl border px-4 py-3 font-medium disabled:opacity-60"
              >
                Cancel connection
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
