import { test, expect } from "@playwright/test";
import { createDemoAnalysis } from "../lib/demo-data";
import { validatePdf } from "../lib/file-validation";
import { simulate } from "../lib/demo-data/simulation";
import { csvCell, findingsCsv } from "../lib/export-csv";
const source = {
  filename: "Example.pdf",
  fileSize: 256,
  mimeType: "application/pdf",
  uploadedAt: "2026-09-27T08:00:00Z",
  analysisTime: "2026-09-27T08:01:00Z",
  sha256: "a".repeat(64),
};
test("legacy data integrity and deterministic graph model", () => {
  const a = createDemoAnalysis(source);
  const b = createDemoAnalysis({ ...source, filename: "Another.pdf" });
  expect(a.findings.length).toBe(70);
  expect(a.findings).toEqual(b.findings);
  expect(a.assets).toEqual(b.assets);
  expect(a.attackPaths).toHaveLength(15);
  expect(a.assets.filter((x) => x.provenance === "Legacy sample")).toHaveLength(
    5,
  );
  expect(new Set(a.assets.map((x) => x.id)).size).toBe(a.assets.length);
  const smb = a.findings.find((f) => f.id === 97833)!;
  expect(smb.cvss).toBe(9.8);
  expect(smb.cves).toHaveLength(6);
  expect(smb.hosts.map((h) => h.ip)).toEqual([
    "192.168.15.112",
    "192.168.15.113",
  ]);
  expect(a.findings.find((f) => f.id === 99359)!.hosts).toHaveLength(3);
  for (const path of a.attackPaths) {
    expect(a.findings.some((f) => f.id === path.findingId)).toBeTruthy();
    expect(
      path.stages.filter((s) => s.evidenceType === "observed"),
    ).toHaveLength(2);
  }
});
test("PDF validation covers format, MIME, empty and size boundaries", () => {
  expect(validatePdf(undefined).valid).toBe(false);
  expect(
    validatePdf(new File(["x"], "scan.txt", { type: "application/pdf" })).valid,
  ).toBe(false);
  expect(
    validatePdf(new File(["x"], "scan.pdf", { type: "text/plain" })).valid,
  ).toBe(false);
  expect(validatePdf(new File([], "scan.pdf")).error).toContain("empty");
  expect(validatePdf(new File(["pdf"], "REPORT.PDF")).valid).toBe(true);
  expect(
    validatePdf({
      name: "a.pdf",
      type: "application/pdf",
      size: 25 * 1024 * 1024,
    } as File).valid,
  ).toBe(true);
  expect(
    validatePdf({
      name: "a.pdf",
      type: "application/pdf",
      size: 25 * 1024 * 1024 + 1,
    } as File).valid,
  ).toBe(false);
});
test("simulation respects scenario relevance and earliest effective control", () => {
  expect(simulate(0, [], "now").reachability).toBe(100);
  expect(simulate(0, ["waf", "rdp"], "now").blockedAt).toBeNull();
  expect(simulate(0, ["smb"], "now").blockedAt).toBe(2);
  expect(simulate(0, ["patch", "edge", "edr"], "now").blockedAt).toBe(1);
  expect(simulate(7, ["edge"], "now").blockedAt).toBeNull();
  expect(simulate(7, ["llmnr"], "now").blockedAt).toBe(2);
  expect(simulate(9, ["segment"], "now").blockedAt).toBe(4);
});
test("CSV escapes cells and includes actual source metadata", () => {
  expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
  const csv = findingsCsv(createDemoAnalysis(source));
  expect(csv).toContain("Example.pdf");
  expect(csv).toContain("2026-09-27T08:01:00Z");
  expect(csv).toContain("Solution");
});
