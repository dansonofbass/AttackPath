"use client";
import { useEffect, useRef, useState } from "react";
import { readLocal, writeLocal } from "@/lib/storage";
export const syncStages = [
  "Connecting",
  "Retrieving records",
  "Normalizing",
  "Correlating",
  "Updating model",
  "Complete",
];
export interface SourceState {
  progress: number;
  records: number;
  last: string | null;
}
export function useSourceSync(notify: (s: string) => void) {
  const [state, setState] = useState<Record<string, SourceState>>(() => {
    const saved = readLocal<Record<string, SourceState>>("ap-sync-v1", {});
    // A page switch cancels timers. Only completed snapshots can be restored.
    return Object.fromEntries(
      Object.entries(saved).filter(([, value]) => value.progress === 100),
    );
  });
  const [logs, setLogs] = useState<string[]>(() =>
    readLocal("ap-sync-log-v1", []),
  );
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  useEffect(
    () => () => Object.values(timers.current).forEach(clearInterval),
    [],
  );
  useEffect(() => {
    writeLocal("ap-sync-v1", state);
  }, [state]);
  useEffect(() => {
    writeLocal("ap-sync-log-v1", logs);
  }, [logs]);
  const log = (s: string) =>
    setLogs((x) =>
      [`${new Date().toLocaleTimeString()} · ${s}`, ...x].slice(0, 40),
    );
  const sync = (name: string, records: number) => {
    if (timers.current[name]) return;
    let progress = 0;
    setState((s) => ({
      ...s,
      [name]: { progress: 0, records: 0, last: null },
    }));
    log(`${name}: simulated synchronization started`);
    timers.current[name] = setInterval(() => {
      progress += 20;
      const done = progress === 100;
      setState((s) => ({
        ...s,
        [name]: {
          progress,
          records: done ? records : 0,
          last: done ? new Date().toISOString() : null,
        },
      }));
      if (done) {
        clearInterval(timers.current[name]);
        delete timers.current[name];
        log(`${name}: ${records} mock records synchronized`);
        notify(`${name} sync complete.`);
      }
    }, 350);
  };
  return {
    state,
    logs,
    sync,
    test: (name: string) => {
      log(`${name}: mock connection test successful (no network request)`);
      notify(`${name}: mock connection ready.`);
    },
    reset: () => {
      Object.values(timers.current).forEach(clearInterval);
      timers.current = {};
      setState({});
      setLogs([]);
      notify("Sync data reset.");
    },
  };
}
