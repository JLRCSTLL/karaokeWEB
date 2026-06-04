import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminNav } from "@/components/admin-nav";
import { DatabaseSetup } from "@/components/database-setup";
import { getDatabaseIssue } from "@/lib/database-status";
import { getQueueSnapshot } from "@/lib/queue";
import { countLibrarySongs, getActiveSession } from "@/lib/supabase-db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let activeSession = null;
  let snapshot = null;
  let libraryCount = 0;

  try {
    activeSession = await getActiveSession();
    snapshot = activeSession ? await getQueueSnapshot(activeSession.sessionCode) : null;
    libraryCount = await countLibrarySongs();
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
        <AdminDashboard initialSnapshot={snapshot} libraryCount={libraryCount} />
      </main>
    </>
  );
}
