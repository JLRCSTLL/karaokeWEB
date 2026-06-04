export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data as T;
}

export function statusClass(status: string) {
  const classes: Record<string, string> = {
    playing: "border-emerald-400/50 bg-emerald-500/15 text-emerald-100",
    approved: "border-cyan-400/40 bg-cyan-500/15 text-cyan-100",
    pending: "border-amber-400/50 bg-amber-500/15 text-amber-100",
    completed: "border-zinc-500/40 bg-zinc-500/15 text-zinc-200",
    skipped: "border-rose-400/40 bg-rose-500/15 text-rose-100",
    rejected: "border-red-400/40 bg-red-500/15 text-red-100",
  };

  return classes[status] || "border-zinc-500/40 bg-zinc-500/15 text-zinc-100";
}
