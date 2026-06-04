"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Library, LayoutDashboard, ListMusic, LogOut, MonitorPlay } from "lucide-react";
import { api } from "@/lib/client-api";

export function AdminNav() {
  const router = useRouter();

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <header className="border-b border-white/10 bg-zinc-950/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/admin" className="text-lg font-semibold text-white">
          QR Karaoke Queue
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link className="btn-ghost" href="/admin">
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <Link className="btn-ghost" href="/admin/queue">
            <ListMusic size={16} /> Queue
          </Link>
          <Link className="btn-ghost" href="/admin/library">
            <Library size={16} /> Library
          </Link>
          <a className="btn-ghost" href="/display/active" target="_blank">
            <MonitorPlay size={16} /> Display
          </a>
          <button className="btn-ghost" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
