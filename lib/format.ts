export const formatSize = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1048576
      ? `${(n / 1024).toFixed(1)} KB`
      : `${(n / 1048576).toFixed(2)} MB`;
export const formatTime = (s: string) =>
  new Date(s).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
export const formatDate = (s: string) => new Date(s).toLocaleString();
export const exportName = (s: string) =>
  `attackpath-ai-${
    s
      .replace(/\.pdf$/i, "")
      .replace(/[^a-z0-9_-]+/gi, "-")
      .toLowerCase()
      .slice(0, 90) || "assessment"
  }`;
