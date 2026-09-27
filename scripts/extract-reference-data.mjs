// One-time data migration only. No legacy application code is executed or shipped.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const html = readFileSync("reference/legacy-prototype.html", "utf8");
const raw = JSON.parse(
  html.match(/const DATA=(\{[\s\S]*?\});\s*let findings/)[1],
);
const clean = (value) =>
  value
    .normalize("NFKC")
    .replace(/https:\/\/static\.tenable\.com\/\S+\s+\d+\/125/g, "")
    .replace(/\s+/g, " ")
    .trim();
const findings = raw.findings.map((f) => {
  const hosts = [
    ...f.title.matchAll(
      /(\d{1,3}(?:\.\d{1,3}){3})\s*\((tcp|udp|icmp)\/(\d+)\)/g,
    ),
  ].map((m) => ({ ip: m[1], protocol: m[2], port: Number(m[3]) }));
  return {
    id: f.id,
    title: clean(f.title.split(" Synopsis")[0]),
    severity: f.risk,
    cvss: f.cvss,
    cves: f.id === 97833 ? f.cves.filter((c) => c !== "CVE-2017-0199") : f.cves,
    hosts: [...new Map(hosts.map((h) => [JSON.stringify(h), h])).values()],
    synopsis: clean(f.synopsis),
    description: clean(f.description),
    solution: clean(f.solution),
    provenance: "Legacy Nessus sample",
  };
});
mkdirSync("lib/demo-data", { recursive: true });
writeFileSync("lib/demo-data/findings.json", JSON.stringify(findings, null, 2));
console.log(
  `${findings.length} findings normalized; ${new Set(findings.flatMap((f) => f.hosts.map((h) => h.ip))).size} observed sample hosts.`,
);
