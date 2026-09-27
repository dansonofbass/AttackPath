import type { AttackPath, Finding, Severity } from "../types";
const definitions: [string, number, string, Severity][] = [
  ["SMB / EternalBlue", 97833, "192.168.15.112", "Critical"],
  ["Windows DNS / MS11-030", 53514, "192.168.15.113", "Critical"],
  ["Schannel / MS14-066", 79638, "192.168.15.112", "Critical"],
  ["RDP exposure + TLS", 10940, "192.168.15.112", "Medium"],
  ["Legacy SSH administrative surface", 73079, "192.168.15.85", "High"],
  ["OpenSSH remote service", 93194, "192.168.15.72", "High"],
  ["SMB lateral movement", 96982, "192.168.15.113", "Critical"],
  ["SMB information exposure", 10150, "192.168.15.112", "Medium"],
  ["SMB authentication surface", 10394, "192.168.15.113", "Medium"],
  ["HTTP / HTTPS exposure", 24260, "192.168.15.43", "Medium"],
  ["Weak TLS / cipher configuration", 42873, "192.168.15.112", "Medium"],
  ["LLMNR identity exposure", 53513, "192.168.15.113", "Medium"],
  ["UPnP discovery", 35711, "192.168.15.112", "Low"],
  ["Missing HSTS", 84502, "192.168.15.43", "Low"],
  ["Firewall boundary observation", 27576, "192.168.15.43", "Medium"],
];
export function createAttackPaths(findings: Finding[]): AttackPath[] {
  return definitions.map(([title, findingId, target, severity], i) => {
    const f = findings.find((f) => f.id === findingId)!;
    const h = f.hosts.find((h) => h.ip === target) ?? f.hosts[0];
    return {
      id: `AP-${String(i + 1).padStart(3, "0")}`,
      title,
      findingId,
      target,
      severity,
      confidence: 94 - i * 2,
      interpretation:
        "Potential progression is inferred from the legacy sample condition and synthetic network relationships. Reachability and successful exploitation are not established. Path severity is an analytical priority, separate from source finding severity.",
      stages: [
        {
          id: "entry",
          label: "ENTRY",
          title: i === 6 || i === 11 ? "User network" : "Untrusted network",
          detail: "Synthetic origin",
          evidenceType: "synthetic",
        },
        {
          id: "boundary",
          label: "BOUNDARY",
          title: "Edge firewall",
          detail: "Modeled policy boundary",
          evidenceType: "synthetic",
        },
        {
          id: "service",
          label: "TARGET SERVICE",
          title: target,
          detail: `${h?.protocol.toUpperCase()}/${h?.port}`,
          evidenceType: "observed",
        },
        {
          id: "finding",
          label: "CONDITION",
          title: title.split(" / ")[0],
          detail: `Plugin ${findingId} · CVSS ${f.cvss ?? "N/A"}`,
          evidenceType: "observed",
        },
        {
          id: "execution",
          label: "POSSIBILITY",
          title: "Potential access",
          detail: "Conditional on exploitation",
          evidenceType: "inferred",
        },
        {
          id: "movement",
          label: "MOVEMENT",
          title: "Potential lateral move",
          detail: "Modeled relationship",
          evidenceType: "inferred",
        },
        {
          id: "impact",
          label: "IMPACT",
          title: "Potential impact",
          detail: "Not proof of compromise",
          evidenceType: "inferred",
        },
      ],
    };
  });
}
