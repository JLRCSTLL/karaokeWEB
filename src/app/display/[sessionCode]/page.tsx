import { redirect } from "next/navigation";
import { KaraokeDisplay } from "@/components/karaoke-display";
import { getQueueSnapshot } from "@/lib/queue";
import { getActiveSession } from "@/lib/supabase-db";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ sessionCode: string }>;
};

export default async function DisplayPage({ params }: Props) {
  const { sessionCode } = await params;
  const code = sessionCode;

  if (sessionCode === "active") {
    const activeSession = await getActiveSession();

    if (activeSession) redirect(`/display/${activeSession.sessionCode}`);
  }

  const snapshot = await getQueueSnapshot(code);

  return <KaraokeDisplay sessionCode={code} initialSnapshot={snapshot} />;
}
