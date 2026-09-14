"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { MessageSquare, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient();
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      const signInError = result.error;
      const sessionExists = Boolean(result.data.session);

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (sessionExists) {
        router.replace("/dashboard");
        router.refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to sign in. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email address to request a password reset.");
      return;
    }

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?reset=true`,
    });

    if (error) {
      setError(error.message);
      setNotice(null);
      return;
    }

    setError(null);
    setNotice("Password reset instructions were sent to your email.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent)] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse-dot delay-1"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--accent-secondary)] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse-dot delay-3"></div>

      <div className="w-full max-w-md animate-scale-in">
        <div className="card p-8 shadow-2xl border border-[var(--border-light)] glass relative z-10">
          
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-[var(--accent-glow)] text-[var(--accent)] rounded-2xl flex items-center justify-center mb-4 shadow-glow">
              <MessageSquare size={32} />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">
              Welcome back
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Sign in to manage your Messenger interactions.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="input-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@example.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <div className="flex justify-between items-center">
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {notice && (
              <div className="p-3 bg-[var(--success-bg)] border border-[var(--success)] text-[var(--success)] text-sm rounded-md animate-fade-in flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] shrink-0"></div>
                {notice}
              </div>
            )}

            {error && (
              <div className="p-3 bg-[var(--danger-bg)] border border-[var(--danger)] text-[var(--danger)] text-sm rounded-md animate-fade-in flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] shrink-0"></div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-12 mt-2 group relative overflow-hidden"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
