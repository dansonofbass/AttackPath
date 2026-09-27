import type { Incident } from "../types";
export const incidents: Incident[] = [
  {
    id: "INC-0042",
    title: "SMB exploitation correlation",
    severity: "Critical",
    status: "ACTIVE",
    asset: "192.168.15.112",
    confidence: 94,
    pathId: "AP-001",
    summary:
      "Synthetic firewall flow, endpoint anomaly and sample SMB exposure.",
  },
  {
    id: "INC-0041",
    title: "RDP exposure activity",
    severity: "High",
    status: "ACTIVE",
    asset: "192.168.15.112",
    confidence: 87,
    pathId: "AP-004",
    summary:
      "Synthetic authentication attempts correlated with Terminal Services.",
  },
  {
    id: "INC-0040",
    title: "Legacy SSH access pattern",
    severity: "Medium",
    status: "ACTIVE",
    asset: "192.168.15.85",
    confidence: 81,
    pathId: "AP-005",
    summary: "Synthetic network events correlated with legacy OpenSSH.",
  },
  {
    id: "INC-0039",
    title: "LLMNR / identity anomaly",
    severity: "Medium",
    status: "REVIEW",
    asset: "192.168.15.113",
    confidence: 76,
    pathId: "AP-012",
    summary: "Synthetic AD authentication and name-resolution telemetry.",
  },
];
