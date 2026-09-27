"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveEvent } from "@/lib/types";
const samples = [
  [
    "FIREWALL",
    "EDGE-FW-01",
    "192.168.15.112:445",
    "192.168.15.112",
    "Initial Access",
    "SMB flow observed",
    95,
  ],
  [
    "EDR",
    "EDR-MGR",
    "WIN81QAAGENT",
    "192.168.15.112",
    "Execution",
    "Process anomaly correlated",
    91,
  ],
  [
    "AD",
    "DC-01",
    "CORP\\svc-backup",
    "192.168.15.113",
    "Identity",
    "Authentication event observed",
    83,
  ],
  [
    "SIEM",
    "CORRELATOR",
    "INC-0042",
    "192.168.15.112",
    "Correlation",
    "Exposure rule matched",
    98,
  ],
  [
    "NETWORK",
    "CORE-01",
    "192.168.15.85:22",
    "192.168.15.85",
    "Remote Service",
    "SSH flow observed",
    81,
  ],
] as const;
function event(id: number, time: string): LiveEvent {
  const s = samples[id % samples.length];
  return {
    id,
    time,
    type: s[0],
    source: s[1],
    destination: s[2],
    asset: s[3],
    stage: s[4],
    message: s[5],
    confidence: s[6],
  };
}
export function useLiveMonitor() {
  const seq = useRef(5);
  const [events, setEvents] = useState<LiveEvent[]>(() =>
    Array.from({ length: 5 }, (_, i) =>
      event(4 - i, new Date(Date.now() - i * 9000).toISOString()),
    ),
  );
  const [auto, setAuto] = useState(true);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const inject = useCallback(() => {
    const id = seq.current++;
    setEvents((prev) =>
      [event(id, new Date().toISOString()), ...prev].slice(0, 100),
    );
    setNow(Date.now());
  }, []);
  useEffect(() => {
    if (!auto || paused) return;
    const timer = setInterval(inject, 8000);
    return () => clearInterval(timer);
  }, [auto, paused, inject]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);
  return {
    events,
    auto,
    setAuto,
    paused,
    setPaused,
    inject,
    clear: () => setEvents([]),
    rate: events.filter((e) => now - new Date(e.time).getTime() < 60000).length,
  };
}
