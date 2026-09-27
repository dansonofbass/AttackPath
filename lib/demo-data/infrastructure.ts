import type {
  Asset,
  Finding,
  InfrastructureModel,
  Severity,
  TopologyNode,
} from "../types";
import { severityRank } from "../severity";
const sites = [
  "HQ / Yerevan",
  "DC East",
  "DC West",
  "Branch North",
  "Branch South",
  "DR Site",
  "Cloud Shared",
  "Cloud DMZ",
];
const specs: [string, number, string][] = [
  ["WAF", 12, "DMZ"],
  ["Firewall", 16, "EDGE"],
  ["Router", 24, "CORE"],
  ["Switch", 96, "CORE"],
  ["Workstation", 852, "USER"],
  ["Email Server", 8, "SERVER"],
  ["File Share Server", 18, "SERVER"],
  ["EDR Controller", 6, "SECURITY"],
  ["AV Management", 4, "SECURITY"],
  ["Domain Controller", 8, "IDENTITY"],
  ["DNS/DHCP", 12, "IDENTITY"],
  ["Web Server", 36, "DMZ"],
  ["App Server", 80, "SERVER"],
  ["DB Server", 34, "SERVER"],
  ["VPN Gateway", 4, "EDGE"],
  ["Proxy", 10, "EDGE"],
  ["Load Balancer", 8, "DMZ"],
  ["Backup Server", 20, "SERVER"],
  ["SIEM", 2, "SECURITY"],
  ["Jump Host", 8, "ADMIN"],
];
export function createAssets(findings: Finding[]): Asset[] {
  const ips = [...new Set(findings.flatMap((f) => f.hosts.map((h) => h.ip)))];
  const observed = ips.map((ip, i): Asset => {
    const fs = findings.filter((f) => f.hosts.some((h) => h.ip === ip));
    return {
      id: `OBS-${i + 1}`,
      hostname: (
        {
          "192.168.15.112": "WIN81QAAGENT",
          "192.168.15.113": "2K8QAAGENT",
          "192.168.15.43": "FEDORA25",
          "192.168.15.72": "SUSE12",
          "192.168.15.85": "RHEL6",
        } as Record<string, string>
      )[ip],
      ip,
      type: "Server",
      os: ip.endsWith("112")
        ? "Windows 8.1 Enterprise"
        : ip.endsWith("113")
          ? "Windows Server 2008 R2"
          : "Linux (legacy)",
      zone: "SERVER",
      site: "Legacy scan network",
      risk:
        [...fs].sort(
          (a, b) => severityRank(a.severity) - severityRank(b.severity),
        )[0]?.severity ?? "None",
      services: [
        ...new Map(
          fs
            .flatMap((f) => f.hosts.filter((h) => h.ip === ip && h.port > 0))
            .map((h) => [
              `${h.protocol}/${h.port}`,
              { protocol: h.protocol, port: h.port },
            ]),
        ).values(),
      ],
      findings: fs.map((f) => f.id),
      edr: false,
      antivirus: false,
      adManaged: false,
      provenance: "Legacy sample",
    };
  });
  let seq = 0;
  const synthetic = specs.flatMap(([type, count, zone], ti) =>
    Array.from({ length: count }, (_, i): Asset => {
      const n = seq++;
      const ports =
        type === "DNS/DHCP"
          ? [53, 5355]
          : type === "DB Server"
            ? [1433, 5432]
            : /Workstation|File Share|Domain|Backup|App/.test(type)
              ? [445, 3389]
              : /Web|WAF|Proxy|Email|VPN|SIEM|Load/.test(type)
                ? [443]
                : [22];
      const risk: Severity =
        n % 29 === 0
          ? "Critical"
          : n % 7 === 0
            ? "High"
            : n % 3 === 0
              ? "Medium"
              : "Low";
      return {
        id: `AST-${String(n + 1).padStart(5, "0")}`,
        hostname: `${["HQ", "DCE", "DCW", "BRN", "BRS", "DR", "CLD", "DMZ"][n % 8]}-${type.toUpperCase().replaceAll(" ", "-")}-${String(i + 1).padStart(3, "0")}`,
        ip: `10.${40 + (n % 8)}.${ti + 1}.${11 + (Math.floor(i / 8) % 235)}`,
        type,
        os: /Workstation|File Share|Domain|App|Backup/.test(type)
          ? "Windows Server / Endpoint"
          : "Infrastructure appliance",
        zone,
        site: sites[n % 8],
        risk,
        services: ports.map((port) => ({
          port,
          protocol: port === 5355 ? "udp" : "tcp",
        })),
        findings: [],
        edr: n % 19 !== 0,
        antivirus: n % 31 !== 0,
        adManaged: /Workstation|Server|Domain|Jump/.test(type),
        provenance: "Synthetic",
      };
    }),
  );
  return [...observed, ...synthetic];
}
export const topologyNodes: TopologyNode[] = [
  { id: "internet", title: "Internet", zone: "EXTERNAL", x: 35, y: 75 },
  { id: "waf", title: "WAF cluster", zone: "DMZ", x: 240, y: 75 },
  { id: "edge", title: "Firewall HA", zone: "EDGE", x: 445, y: 75 },
  { id: "core", title: "Core routing", zone: "CORE", x: 650, y: 75 },
  { id: "users", title: "User network", zone: "USER", x: 35, y: 260 },
  { id: "servers", title: "Server network", zone: "SERVER", x: 240, y: 260 },
  { id: "identity", title: "Identity / AD", zone: "IDENTITY", x: 445, y: 260 },
  { id: "security", title: "Security / SOC", zone: "SECURITY", x: 650, y: 260 },
  { id: "dmz", title: "DMZ services", zone: "DMZ", x: 240, y: 435 },
  { id: "admin", title: "Admin network", zone: "ADMIN", x: 445, y: 435 },
];
export function createInfrastructure(assets: Asset[]): InfrastructureModel {
  const rows = assets.filter((a) => a.provenance === "Synthetic");
  const firewall = [
    ["Internet", "WAF VIPs", "TCP/443", "ALLOW", "Published web entry"],
    [
      "Internet",
      "Internal Windows",
      "TCP/445",
      "DENY",
      "Boundary SMB protection",
    ],
    ["Internet", "RDP Gateway", "TCP/3389", "DENY", "Direct RDP blocked"],
    [
      "Admin VLAN",
      "Jump Hosts",
      "TCP/22,3389",
      "ALLOW",
      "Privileged administration",
    ],
    ["User VLAN", "File Share", "TCP/445", "ALLOW", "Internal SMB access"],
    ["DMZ", "Corp Servers", "ANY", "DENY", "Segmentation default deny"],
    ["Corp", "DNS/DHCP", "UDP/TCP 53", "ALLOW", "Name resolution"],
    [
      "Backup VLAN",
      "File/App Servers",
      "TCP/445,443",
      "ALLOW",
      "Backup replication",
    ],
    ["VPN", "User VLAN", "TCP/443", "ALLOW", "Remote access"],
    ["Mail Relay", "Internet", "TCP/25,587", "ALLOW", "Mail delivery"],
    ["User VLAN", "Internet", "TCP/80,443", "ALLOW", "Web egress"],
    ["DMZ", "Identity/AD", "ANY", "RESTRICT", "Explicit authentication only"],
  ].map((r, i) => ({
    Rule: `FW-${String(i + 1).padStart(3, "0")}`,
    Source: r[0],
    Destination: r[1],
    Service: r[2],
    Action: r[3],
    Purpose: r[4],
  }));
  return {
    nodes: topologyNodes,
    links: [
      ["internet", "waf"],
      ["waf", "edge"],
      ["edge", "core"],
      ["core", "users"],
      ["core", "servers"],
      ["core", "identity"],
      ["servers", "security"],
      ["users", "security"],
      ["edge", "dmz"],
      ["identity", "admin"],
    ],
    sites,
    identity: {
      forest: "ad.mockcorp.local",
      privilegedAccounts: 182,
      serviceAccounts: 2461,
      trusts: 2,
      domains: [
        {
          name: "corp.ad.mockcorp.local",
          controllers: 4,
          users: 6200,
          groups: 210,
          organizationalUnits: 9,
        },
        {
          name: "eu.ad.mockcorp.local",
          controllers: 3,
          users: 3600,
          groups: 135,
          organizationalUnits: 6,
        },
        {
          name: "ops.ad.mockcorp.local",
          controllers: 3,
          users: 2800,
          groups: 120,
          organizationalUnits: 5,
        },
      ],
    },
    database: {
      "Threat Intelligence": [
        {
          Indicator: "192.0.2.10",
          Type: "IPv4",
          Context: "Simulated command-and-control indicator",
          Confidence: 85,
          Source: "Demo threat feed",
          Provenance: "Synthetic",
        },
        {
          Indicator: "phishing.example",
          Type: "Domain",
          Context: "Simulated phishing indicator",
          Confidence: 80,
          Source: "Demo threat feed",
          Provenance: "Synthetic",
        },
        {
          Indicator: "CVE-2017-0144",
          Type: "CVE",
          Context: "SMB / EternalBlue sample correlation",
          Confidence: 95,
          Source: "Demo vulnerability feed",
          Provenance: "Synthetic enrichment",
        },
        {
          Indicator: "CVE-2014-6321",
          Type: "CVE",
          Context: "Schannel sample correlation",
          Confidence: 90,
          Source: "Demo vulnerability feed",
          Provenance: "Synthetic enrichment",
        },
      ],
      Assets: rows.map((a) => ({
        Asset: a.hostname,
        IP: a.ip,
        Type: a.type,
        Zone: a.zone,
        Site: a.site,
        Risk: a.risk,
        EDR: a.edr,
        AV: a.antivirus,
      })),
      "AD Users": Array.from({ length: 96 }, (_, i) => ({
        User: `user${String(i + 1).padStart(4, "0")}`,
        Department: [
          "Finance",
          "HR",
          "IT",
          "Engineering",
          "Sales",
          "Security",
          "Operations",
        ][i % 7],
        Domain: ["corp", "eu", "ops"][i % 3] + ".ad.mockcorp.local",
        Enabled: i % 17 !== 0,
        Privileged: i % 23 === 0,
      })),
      "AD Groups": [
        "Domain Admins",
        "Enterprise Admins",
        "Server Admins",
        "Helpdesk Tier 2",
        "Desktop Support",
        "Security Operations",
        "Exchange Admins",
        "Backup Operators",
        "File Share Operators",
      ].map((name, i) => ({
        Group: name,
        Members: 45 + i * 17,
        Privileged: /Admin|Backup/.test(name),
        Scope: i < 2 ? "Forest" : "Domain",
      })),
      "AD Computers": rows
        .filter((a) => a.adManaged)
        .slice(0, 420)
        .map((a, i) => ({
          Hostname: a.hostname,
          IP: a.ip,
          OU: ["Workstations", "Servers", "Tier0", "Tier1"][i % 4],
          OS: a.os,
          Stale: i % 19 === 0,
        })),
      GPO: Array.from({ length: 18 }, (_, i) => ({
        Policy:
          [
            "Domain Security Baseline",
            "Windows Firewall Baseline",
            "SMB Hardening",
            "LAPS Policy",
            "EDR Onboarding",
            "Screen Lock",
            "PowerShell Constrained Language",
            "RDP Restriction",
            "Audit Policy",
          ][i % 9] + ` ${i + 1}`,
        Status: i % 7 === 0 ? "Review" : "Applied",
        LinkedOUs: 2 + (i % 6),
        Risk: i % 8 === 0 ? "High" : "Low",
      })),
      "Firewall Rules": firewall,
      Interfaces: rows.slice(0, 220).map((a, i) => ({
        Device: a.hostname,
        IP: a.ip,
        Interface: `Gi${(i % 48) + 1}/0`,
        VLAN: `VLAN-${10 + (i % 8) * 10}`,
        Status: "Up",
        Speed: i % 3 ? "1G" : "10G",
      })),
      DNS: rows
        .filter((a) => a.type === "DNS/DHCP")
        .map((a) => ({
          Hostname: a.hostname,
          IP: a.ip,
          Records: 4200,
          Forwarders: "10.40.0.53; 10.40.0.54",
        })),
      EDR: rows
        .filter((a) => a.edr)
        .map((a, i) => ({
          Asset: a.hostname,
          Version: ["8.2.1", "8.4.0", "8.5.2"][i % 3],
          Health: i % 29 === 0 ? "Offline" : "Healthy",
          Policy: i % 2 ? "Standard Endpoint" : "Server High Security",
        })),
      Antivirus: rows
        .filter((a) => a.antivirus)
        .map((a, i) => ({
          Asset: a.hostname,
          Product: "MockAV Enterprise",
          Version: "5.5.1",
          DefinitionsAgeDays: i % 31 === 0 ? 14 : i % 11,
          Enabled: i % 37 !== 0,
        })),
      "Network Links": rows.slice(0, 260).map((a, i) => ({
        Source: a.ip,
        Destination: `10.${40 + (i % 8)}.1.1`,
        Relationship: i % 3 ? "Routes via" : "Uplink",
        Protocol: i % 4 ? "OSPF" : "BGP",
      })),
    },
  };
}
