import raw from "./findings.json";
import type { AnalysisResult, Finding, ReportSource } from "../types";
import { createAssets, createInfrastructure } from "./infrastructure";
import { createAttackPaths } from "./attack-paths";
import { sortFindings } from "../severity";
export function createDemoAnalysis(source: ReportSource): AnalysisResult {
  const findings = (raw as Finding[]).map((f) => ({ ...f })).sort(sortFindings);
  const assets = createAssets(findings);
  return {
    source,
    findings,
    assets,
    attackPaths: createAttackPaths(findings),
    infrastructure: createInfrastructure(assets),
    remediation: findings.filter(
      (f) => f.severity !== "None" && f.severity !== "Info",
    ),
  };
}
