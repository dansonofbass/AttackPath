import type { Severity, SimulationResult } from "../types";
export const controls = [
  {
    id: "edge",
    label: "Edge firewall blocks inbound traffic",
    stage: 1,
    effect: "Blocks remote entry",
    scenarios: [0, 1, 2, 3, 4, 5, 6, 8],
  },
  {
    id: "smb",
    label: "Block SMB TCP/445",
    stage: 2,
    effect: "Removes SMB reachability",
    scenarios: [0, 1],
  },
  {
    id: "rdp",
    label: "Block RDP TCP/3389",
    stage: 2,
    effect: "Removes RDP reachability",
    scenarios: [3, 5],
  },
  {
    id: "patch",
    label: "Patch vulnerable condition",
    stage: 3,
    effect: "Removes vulnerable condition",
    scenarios: [0, 1, 2, 3, 4],
  },
  {
    id: "ssh",
    label: "Upgrade / isolate legacy SSH",
    stage: 2,
    effect: "Removes legacy administrative surface",
    scenarios: [4],
  },
  {
    id: "waf",
    label: "WAF protection",
    stage: 2,
    effect: "Blocks modeled web route",
    scenarios: [6],
  },
  {
    id: "mfa",
    label: "MFA on privileged access",
    stage: 4,
    effect: "Interrupts identity progression",
    scenarios: [4, 5, 7],
  },
  {
    id: "edr",
    label: "EDR containment",
    stage: 4,
    effect: "Contains modeled endpoint progression",
    scenarios: [0, 1, 2, 3, 4, 5, 7],
  },
  {
    id: "llmnr",
    label: "Disable LLMNR",
    stage: 2,
    effect: "Removes name-resolution surface",
    scenarios: [2, 7],
  },
  {
    id: "segment",
    label: "Network segmentation",
    stage: 4,
    effect: "Blocks cross-zone movement",
    scenarios: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
];
export const scenarios = [
  { name: "SMB ransomware-style entry", path: "AP-001" },
  { name: "SMB second-host spread", path: "AP-007" },
  { name: "Windows DNS / LLMNR path", path: "AP-002" },
  { name: "Schannel / TLS server exposure", path: "AP-003" },
  { name: "Legacy SSH administrative surface", path: "AP-005" },
  { name: "RDP exposure", path: "AP-004" },
  { name: "Web application exposure", path: "AP-010" },
  { name: "LLMNR-assisted internal path", path: "AP-012" },
  { name: "Firewall segmentation validation", path: "AP-015" },
  { name: "UPnP discovery path", path: "AP-013" },
].map((s, i) => ({ ...s, id: `SIM-${String(i + 1).padStart(3, "0")}` }));
export function simulate(
  index: number,
  enabled: string[],
  completedAt: string,
): SimulationResult {
  const effective = controls
    .filter((c) => enabled.includes(c.id) && c.scenarios.includes(index))
    .sort((a, b) => a.stage - b.stage);
  const first = effective[0];
  const blockedAt = first?.stage ?? null;
  return {
    scenarioId: scenarios[index].id,
    scenario: scenarios[index].name,
    controls: enabled,
    blockedAt,
    reason: first
      ? first.effect
      : "Modeled impact reached; successful compromise is not established.",
    reachability: blockedAt === null ? 100 : Math.round((blockedAt / 6) * 100),
    residualRisk: (blockedAt === null
      ? "High"
      : blockedAt <= 2
        ? "Low"
        : "Medium") as Severity,
    completedAt,
  };
}
