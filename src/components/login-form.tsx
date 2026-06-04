"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { api } from "@/lib/client-api";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      router.push("/admin");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel mx-auto flex w-full max-w-md flex-col gap-4 p-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">Host Access</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Admin login</h1>
      </div>
      <label className="field-label">
        Username
        <input className="field" value={username} onChange={(event) => setUsername(event.target.value)} />
      </label>
      <label className="field-label">
        Password
        <input
          className="field"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error ? <p className="rounded-md border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm text-red-100">{error}</p> : null}
      <button className="btn-primary justify-center" disabled={loading}>
        <LogIn size={18} /> {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
