import { AdminNav } from "@/components/admin-nav";
import { DatabaseSetup } from "@/components/database-setup";
import { QueueManager } from "@/components/queue-manager";
import { getDatabaseIssue } from "@/lib/database-status";
import { getQueueSnapshot } from "@/lib/queue";
import { getActiveSession } from "@/lib/supabase-db";

export const dynamic = "force-dynamic";

export default async function AdminQueuePage() {
  let activeSession = null;
  let snapshot = null;

  try {
    activeSession = await getActiveSession();
    snapshot = activeSession ? await getQueueSnapshot(activeSession.sessionCode) : null;
  } catch (caught) {
    const issue = getDatabaseIssue(caught);

    if (issue) {
      return (
        <>
          <AdminNav />
          <main className="mx-auto w-full max-w-7xl px-4 py-6">
            <DatabaseSetup issue={issue} />
          </main>
        </>
      );
    }

    throw caught;
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <QueueManager sessionCode={activeSession?.sessionCode} initialSnapshot={snapshot} />
      </main>
    </>
  );
}
