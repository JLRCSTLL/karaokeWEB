"use client";

import { useEffect, useState } from "react";
import type { QueueSnapshot } from "@/lib/types";

export function useRealtimeQueue(sessionCode?: string, initialSnapshot?: QueueSnapshot | null) {
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(initialSnapshot || null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sessionCode) return;

    const events = new EventSource(`/api/events/${sessionCode}`);
    events.addEventListener("snapshot", (event) => {
      const nextSnapshot = JSON.parse((event as MessageEvent).data) as QueueSnapshot | null;
      setSnapshot(nextSnapshot);
      setConnected(true);
    });
    events.onerror = () => setConnected(false);

    return () => events.close();
  }, [sessionCode]);

  return { snapshot, connected, setSnapshot };
}
