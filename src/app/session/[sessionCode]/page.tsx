import { GuestSession } from "@/components/guest-session";
import { getQueueSnapshot } from "@/lib/queue";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ sessionCode: string }>;
};

export default async function SessionPage({ params }: Props) {
  const { sessionCode } = await params;
  const snapshot = await getQueueSnapshot(sessionCode);

  return <GuestSession sessionCode={sessionCode} initialSnapshot={snapshot} />;
}
