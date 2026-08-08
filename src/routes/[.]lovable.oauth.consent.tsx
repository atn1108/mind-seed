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
      Không tải được yêu cầu kết nối: {String((error as Error)?.message ?? error)}
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
        setError("Thiếu authorization_id.");
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
      setError("Máy chủ uỷ quyền không trả về địa chỉ chuyển hướng.");
      setBusy(false);
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "ứng dụng này";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="surface w-full max-w-md rounded-3xl p-8 shadow-lg">
        {loading ? (
          <p className="text-muted-foreground">Đang tải…</p>
        ) : !email ? (
          <>
            <h1 className="text-xl font-semibold">Đăng nhập để kết nối</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Hãy đăng nhập vào MindSeed để cấp quyền cho ứng dụng bên ngoài.
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
              Đăng nhập với Google
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">Kết nối {clientName} với MindSeed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {clientName} sẽ có thể gọi các công cụ MindSeed thay mặt bạn.
            </p>
            <p className="mt-4 text-sm">
              Đang đăng nhập: <span className="font-medium">{email}</span>
            </p>
            {details?.client?.redirect_uri && (
              <p className="mt-1 break-all text-xs text-muted-foreground">
                Chuyển hướng tới: {details.client.redirect_uri}
              </p>
            )}
            {details?.scope && (
              <p className="mt-1 text-xs text-muted-foreground">Quyền yêu cầu: {details.scope}</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Việc này không vượt qua các quy tắc bảo mật của MindSeed.
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
                Đồng ý
              </button>
              <button
                disabled={busy}
                onClick={() => decide(false)}
                className="flex-1 rounded-2xl border px-4 py-3 font-medium disabled:opacity-60"
              >
                Huỷ kết nối
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
