"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api, { TOKEN_STORAGE_KEY } from "../components/axios";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/login", { email, password });
      if (data.success && data.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        router.push("/");
        router.refresh();
      } else {
        setError(data.message || "Login failed.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Login failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 shadow-xl shadow-black/20 p-8 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Use your email and password to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500/70 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500/70 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
