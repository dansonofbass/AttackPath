"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type {
  AnalysisResult,
  AppStage,
  UploadedReport,
  DemoReport,
} from "@/lib/types";
import { LoginScreen } from "@/components/auth/login-screen";
import { UploadWorkspace } from "@/components/upload/upload-workspace";
import { AnalysisScreen } from "@/components/analysis/analysis-screen";
const Platform = dynamic(
  () =>
    import("@/components/shell/application-shell").then(
      (m) => m.ApplicationShell,
    ),
  {
    loading: () => (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted">
        Opening security workspace…
      </div>
    ),
  },
);
export function AppController() {
  const [stage, setStage] = useState<AppStage>("login");
  const [user, setUser] = useState("");
  const [report, setReport] = useState<UploadedReport | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [demoReport, setDemoReport] = useState<DemoReport | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (sessionStorage.getItem("ap-session") === "admin") {
          setUser("admin");
          setStage("upload");
        }
      } catch {}
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const complete = useCallback((result: AnalysisResult) => {
    setAnalysis(result);
    setStage("analysis-complete");
  }, []);
  const reset = () => {
    setReport(null);
    setDemoReport(null);
    setAnalysis(null);
    setStage("upload");
  };
  const signOut = () => {
    try {
      sessionStorage.removeItem("ap-session");
    } catch {}
    setUser("");
    setReport(null);
    setDemoReport(null);
    setAnalysis(null);
    setStage("login");
  };
  if (!ready) return <div className="workflow-bg min-h-dvh" />;
  if (stage === "login")
    return (
      <LoginScreen
        onLogin={(name) => {
          setUser(name);
          try {
            sessionStorage.setItem("ap-session", name);
          } catch {}
          setStage("upload");
        }}
      />
    );
  if (stage === "upload" || stage === "file-ready")
    return (
      <UploadWorkspace
        user={user}
        onSignOut={signOut}
        report={report}
        onSelect={(r) => {
          setReport(r);
          setStage(r ? "file-ready" : "upload");
        }}
        onAnalyze={() => {
          if (report) setStage("analyzing");
        }}
        onDemo={() => {
          setReport(null);
          setAnalysis(null);
          setDemoReport({
            isDemo: true,
            filename: "Demo report (sample data)",
            size: 0,
            mimeType: "application/json",
            uploadedAt: new Date().toISOString(),
          });
          setStage("analyzing");
        }}
      />
    );
  if (
    (stage === "analyzing" || stage === "analysis-complete") &&
    (report || demoReport)
  )
    return (
      <AnalysisScreen
        user={user}
        onSignOut={signOut}
        report={(report || demoReport)!}
        result={analysis}
        onComplete={complete}
        onOpen={() => setStage("platform")}
        onRetry={reset}
      />
    );
  if (stage === "platform" && analysis)
    return (
      <Platform
        analysis={analysis}
        user={user}
        onNew={reset}
        onSignOut={signOut}
      />
    );
  return null;
}
