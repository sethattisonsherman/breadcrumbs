const { chromium } = require("playwright-core");
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
(async () => {
  const root = path.resolve(process.env.PAGES_DIRECTORY || "dist");
  const requests = [];
  const server = http.createServer(async (req, res) => {
    requests.push(req.url);
    if (!req.url.startsWith("/breadcrumbs/")) {
      res.writeHead(404);
      res.end();
      return;
    }
    const relative =
      decodeURIComponent(req.url.split("?")[0].slice("/breadcrumbs/".length)) ||
      "index.html";
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      const data = await fs.readFile(file);
      const type = file.endsWith(".js")
        ? "text/javascript"
        : file.endsWith(".css")
          ? "text/css"
          : "text/html";
      res.writeHead(200, { "Content-Type": type });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((r) => server.listen(3112, "127.0.0.1", r));
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1365, height: 1000 },
    });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:3112/breadcrumbs/");
    await page
      .getByRole("heading", { name: "How does your curiosity work?" })
      .waitFor();
    await page.getByText("Saved in this browser", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Follow this path" }).click();
    await page.getByLabel("I’d love to learn…").fill("Sketching");
    await page.getByRole("button", { name: "Follow this path" }).click();
    await page.getByRole("button", { name: "Follow this path" }).click();
    await page.getByRole("button", { name: /2 minutes/ }).click();
    await page.getByRole("button", { name: "Follow this path" }).click();
    await page.getByRole("button", { name: "Find my first step" }).click();
    await page.getByRole("button", { name: "Light my first star" }).click();
    await page
      .getByRole("heading", { name: "Sketching", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Take this little step", exact: true })
      .click();
    const steps = page.locator(".practice-steps>button");
    for (let i = 0; i < 3; i++) await steps.nth(i).click();
    await page
      .locator("#practice-output")
      .fill("I drew a mug with three shapes.");
    await page.getByRole("button", { name: "I took this little step" }).click();
    await page
      .locator("#reflection")
      .fill("The handle is more oval than I expected.");
    await page.getByRole("button", { name: "Save this little win" }).click();
    await page
      .getByRole("button", { name: "Back to my constellation" })
      .click();
    await page.getByText("Saved in this browser", { exact: true }).waitFor();
    await page.reload();
    await page
      .getByRole("button", { name: "Field notes", exact: true })
      .click();
    await page.getByText(/The handle is more oval/).waitFor();
    const state = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("breadcrumbs-v1")),
    );
    assert.equal(state.skills[0].sessions, 1);
    assert.equal(state.notes.length, 1);
    await page.setViewportSize({ width: 390, height: 844 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await fs.mkdir("work/pages", { recursive: true });
    await page.screenshot({
      path: "work/pages/static-mobile.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    assert(
      !requests.some((url) => url.includes("/api/")),
      "A static Pages build must not call nonexistent local API routes",
    );
    assert(
      requests.some(
        (url) => url.startsWith("/breadcrumbs/assets/") && url.endsWith(".js"),
      ),
    );
    console.log(
      "PASS: built Pages assets load under /breadcrumbs/; onboarding, practice, reflections, and browser persistence work without a backend.",
    );
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
