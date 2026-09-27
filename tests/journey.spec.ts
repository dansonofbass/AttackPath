import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
const pdf = {
  name: "Quarterly-Nessus-Report.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF"),
};
async function login(page: Page) {
  await page.getByLabel("Username", { exact: true }).fill("admin");
  await page.getByLabel("Password", { exact: true }).fill("admin");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Turn vulnerability/ }),
  ).toBeVisible();
}
async function analyze(page: Page) {
  await page.getByLabel("Select PDF report").setInputFiles(pdf);
  await page
    .getByRole("button", { name: "Analyze Report", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Analyzing vulnerability report" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Analysis complete", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Generate Security Model" }).click();
  await expect(
    page.getByRole("heading", { name: "Security Dashboard", exact: true }),
  ).toBeVisible();
}
async function nav(page: Page, name: string) {
  await page
    .locator("aside")
    .getByRole("button", { name, exact: true })
    .click();
}
test("complete desktop journey, local persistence, exports and reset", async ({
  page,
}) => {
  mkdirSync("test-results/qa", { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Welcome to AttackPath AI" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/qa/login.png" });
  await page.getByLabel("Username", { exact: true }).fill("admin");
  await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Invalid",
  );
  await login(page);
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await page.screenshot({ path: "test-results/qa/upload.png" });
  await page.getByLabel("Select PDF report").setInputFiles({
    name: "invalid.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("no"),
  });
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Only PDF",
  );
  await page.getByLabel("Select PDF report").setInputFiles({
    name: "empty.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(""),
  });
  await expect(page.locator("main").getByRole("alert")).toContainText("empty");
  await page.getByLabel("Select PDF report").setInputFiles(pdf);
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Drop your PDF report here/ }),
  ).toBeVisible();
  await analyze(page);
  await page.screenshot({
    path: "test-results/qa/dashboard.png",
    fullPage: true,
  });
  await nav(page, "Findings");
  await page
    .getByRole("textbox", { name: "Search", exact: true })
    .fill("97833");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page
    .locator("tbody tr")
    .first()
    .getByRole("button", { name: /MS17/ })
    .click();
  await expect(page.getByRole("dialog")).toContainText("CVE-2017-0144");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .locator("tbody tr")
    .getByRole("button", { name: "Create Task", exact: true })
    .click();
  await page.getByLabel("Assignee", { exact: true }).fill("Alex Security");
  await page.getByLabel("Status", { exact: true }).selectOption("In Progress");
  await page.getByRole("button", { name: "Save Task", exact: true }).click();
  await nav(page, "Tasks & Jira");
  await expect(page.locator("tbody")).toContainText("Alex Security");
  await page
    .getByRole("button", { name: "Create Jira Issue", exact: true })
    .click();
  await expect(page.locator("tbody")).toContainText("SEC-101");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Description", exact: true }),
  ).toHaveValue(/Recommended solution/);
  await page.getByLabel("Status", { exact: true }).selectOption("Resolved");
  await page.getByRole("button", { name: "Save Task", exact: true }).click();
  await page.screenshot({ path: "test-results/qa/tasks.png", fullPage: true });
  await nav(page, "Attack Paths");
  await page.getByRole("button", { name: /AP-005/ }).click();
  await expect(page.getByRole("heading", { name: /AP-005/ })).toBeVisible();
  await page.screenshot({ path: "test-results/qa/paths.png", fullPage: true });
  await nav(page, "Infrastructure");
  await page
    .getByRole("button", { name: "Select Server network", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Server network", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search", exact: true })
    .fill("192.168.15.113");
  await page.getByRole("button", { name: "2K8QAAGENT", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Asset details" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset Layout" }).click();
  await page.screenshot({
    path: "test-results/qa/infrastructure.png",
    fullPage: true,
  });
  await nav(page, "AD / Firewall Sync");
  await page.getByRole("button", { name: "Sync All", exact: true }).click();
  await expect(page.getByText("Synced", { exact: true })).toHaveCount(7, {
    timeout: 10000,
  });
  await page.getByRole("tab", { name: "Threat Intelligence", exact: true }).click();
  await expect(page.locator("tbody")).toContainText("CVE-2017-0144");
  await page.getByRole("tab", { name: "Firewall Rules", exact: true }).click();
  await expect(page.locator("tbody")).toContainText("FW-001");
  await page.getByRole("tab", { name: "AD Users", exact: true }).click();
  await expect(page.locator("tbody")).toContainText("user0001");
  await nav(page, "Live Attack Monitoring");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Clear Feed" }).click();
  await expect(page.getByText("Event feed cleared")).toBeVisible();
  await page.getByRole("button", { name: "Inject Mock Event" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: /INC-0040/ }).click();
  await expect(
    page.getByRole("heading", { name: /INC-0040.*Correlated activity/ }),
  ).toBeVisible();
  await nav(page, "What-If");
  await page.getByRole("button", { name: "Baseline", exact: true }).click();
  await page
    .getByRole("button", { name: "Run Simulation", exact: true })
    .click();
  await expect(
    page.getByText("Simulation complete", { exact: true }),
  ).toBeVisible({ timeout: 6000 });
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Hardened", exact: true }).click();
  await page
    .getByRole("button", { name: "Run Simulation", exact: true })
    .click();
  await expect(
    page.getByText("Simulation complete", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("17%", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "test-results/qa/simulation.png",
    fullPage: true,
  });
  await nav(page, "Reports");
  for (const [name, ext] of [
    ["Download Security Assessment", "pdf"],
    ["Download JSON Export", "json"],
    ["Download CSV Export", "csv"],
    ["Download Text Report", "txt"],
  ]) {
    const downloaded = page.waitForEvent("download");
    await page.getByRole("button", { name, exact: true }).click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toContain("quarterly-nessus-report");
    await download.saveAs(`test-results/qa/assessment.${ext}`);
  }
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Turn vulnerability/ }),
  ).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await analyze(page);
  await nav(page, "Tasks & Jira");
  await expect(page.locator("tbody")).toContainText("SEC-101");
  await expect(page.locator("tbody")).toContainText("Resolved");
  await nav(page, "Remediation");
  await expect(
    page.getByRole("heading", { name: "Prioritized corrective actions" }),
  ).toBeVisible();
  await nav(page, "Vulnerability Scans");
  await expect(page.getByText(pdf.name, { exact: true }).last()).toBeVisible();
  await page
    .locator("aside")
    .getByRole("button", { name: "Analyze Another Report" })
    .click();
  await page
    .getByRole("button", { name: "Start New Analysis", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Turn vulnerability/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome to AttackPath AI" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("mobile drop, drawer, Escape and overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await login(page);
  const transfer = await page.evaluateHandle(() => {
    const d = new DataTransfer();
    d.items.add(
      new File(["%PDF-1.4\n%%EOF"], "Mobile.pdf", { type: "application/pdf" }),
    );
    return d;
  });
  await page
    .getByRole("button", { name: /Drop your PDF report here/ })
    .dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.getByText("Mobile.pdf", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Analyze Report", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Analysis complete", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Generate Security Model" }).click();
  await expect(
    page.getByRole("heading", { name: "Security Dashboard", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Navigation" }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("dialog", { name: "Navigation" })
    .getByRole("button", { name: "Findings", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Navigation" }),
  ).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Findings", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({ path: "test-results/qa/mobile.png", fullPage: true });
});
