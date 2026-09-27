export type Severity = "Critical" | "High" | "Medium" | "Low" | "Info" | "None";
export type AppStage =
  | "login"
  | "upload"
  | "file-ready"
  | "analyzing"
  | "analysis-complete"
  | "platform";
export type AppPage =
  | "dashboard"
  | "live"
  | "scans"
  | "attack-paths"
  | "infrastructure"
  | "sync"
  | "findings"
  | "remediation"
  | "tasks"
  | "what-if"
  | "reports";
export interface Service {
  protocol: "tcp" | "udp" | "icmp";
  port: number;
  name?: string;
}
export interface Finding {
  id: number;
  title: string;
  severity: Severity;
  cvss: number | null;
  cves: string[];
  hosts: (Service & { ip: string })[];
  synopsis: string;
  description: string;
  solution: string;
  provenance: string;
}
export interface Asset {
  id: string;
  hostname: string;
  ip: string;
  type: string;
  os: string;
  zone: string;
  site: string;
  risk: Severity;
  services: Service[];
  findings: number[];
  edr: boolean;
  antivirus: boolean;
  adManaged: boolean;
  provenance: "Synthetic" | "Legacy sample";
}
export interface AttackPathStage {
  id: string;
  label: string;
  title: string;
  detail: string;
  evidenceType: "observed" | "inferred" | "synthetic";
}
export interface AttackPath {
  id: string;
  title: string;
  severity: Severity;
  target: string;
  confidence: number;
  findingId: number;
  stages: AttackPathStage[];
  interpretation: string;
}
export interface ReportSource {
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  analysisTime: string;
  sha256: string;
}
export interface UploadedReport {
  file: File;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}
export interface TopologyNode {
  id: string;
  title: string;
  zone: string;
  x: number;
  y: number;
}
export interface InfrastructureModel {
  nodes: TopologyNode[];
  links: [string, string][];
  sites: string[];
  identity: {
    forest: string;
    privilegedAccounts: number;
    serviceAccounts: number;
    trusts: number;
    domains: {
      name: string;
      controllers: number;
      users: number;
      groups: number;
      organizationalUnits: number;
    }[];
  };
  database: Record<string, Record<string, string | number | boolean>[]>;
}
export interface AnalysisResult {
  source: ReportSource;
  findings: Finding[];
  assets: Asset[];
  attackPaths: AttackPath[];
  infrastructure: InfrastructureModel;
  remediation: Finding[];
}
export interface RemediationTask {
  id: string;
  findingId: number;
  jiraKey?: string;
  severity: Severity;
  priority: string;
  asset: string;
  summary: string;
  description: string;
  assignee: string;
  dueDate: string;
  status: "Open" | "In Progress" | "Blocked" | "Resolved";
  jiraStatus?: string;
  createdAt: string;
}
export interface JiraConfig {
  mode: "mock" | "live";
  baseUrl: string;
  projectKey: string;
  proxyEndpoint: string;
}
export interface SimulationResult {
  scenarioId: string;
  scenario: string;
  controls: string[];
  blockedAt: number | null;
  reason: string;
  reachability: number;
  residualRisk: Severity;
  completedAt: string;
}
export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: "ACTIVE" | "REVIEW";
  asset: string;
  confidence: number;
  pathId: string;
  summary: string;
}
export interface LiveEvent {
  id: number;
  time: string;
  type: string;
  source: string;
  destination: string;
  asset: string;
  stage: string;
  confidence: number;
  message: string;
}
