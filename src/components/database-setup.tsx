import type { DatabaseIssue } from "@/lib/database-status";

type Props = {
  issue: DatabaseIssue;
};

export function DatabaseSetup({ issue }: Props) {
  return (
    <div className="panel mx-auto max-w-3xl p-6">
      <p className="eyebrow">Database Setup</p>
      <h1 className="mt-2 text-3xl font-semibold text-white">{issue.title}</h1>
      <p className="mt-3 text-zinc-300">{issue.message}</p>
      <div className="mt-5 space-y-2">
        {issue.commands.map((command) => (
          <code
            className="block rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-cyan-100"
            key={command}
          >
            {command}
          </code>
        ))}
      </div>
      <p className="mt-4 text-sm text-zinc-400">
        Using Supabase: paste your Project Settings &gt; Database &gt; Connect pooler URL into{" "}
        <code className="rounded bg-black px-1.5 py-0.5 text-cyan-100">DATABASE_URL</code>.
      </p>
      <p className="mt-4 text-sm text-zinc-500">Refresh this page after the commands finish.</p>
    </div>
  );
}
