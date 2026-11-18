const { chromium } = require("playwright-core");
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");

function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const candidates =
    process.platform === "win32"
      ? [
          path.join(
            process.env.PROGRAMFILES || "C:\\Program Files",
            "Google/Chrome/Application/chrome.exe",
          ),
          path.join(
            process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)",
            "Microsoft/Edge/Application/msedge.exe",
          ),
          path.join(
            process.env.LOCALAPPDATA || "",
            "Google/Chrome/Application/chrome.exe",
          ),
          path.join(
            process.env.LOCALAPPDATA || "",
            "Microsoft/Edge/Application/msedge.exe",
          ),
        ]
      : process.platform === "darwin"
        ? [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
          ]
        : [
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/usr/bin/google-chrome",
            "/usr/bin/microsoft-edge",
          ];
  const found = candidates.find(
    (candidate) => candidate && require("node:fs").existsSync(candidate),
  );
  if (!found)
    throw new Error(
      "Set CHROMIUM_PATH to an installed Chrome or Edge executable.",
    );
  return found;
}

async function answerSurvey(page) {
  for (let index = 1; index <= 6; index++) {
    const section = page.locator(
      `.survey[aria-label="Learning preference question ${index} of 6"]`,
    );
    await section.waitFor();
    await section.getByRole("button").first().click();
  }
  await page
    .getByRole("heading", { name: "What do you want to learn?" })
    .waitFor();
}

async function startLesson(page, subject) {
  await page.getByLabel("What do you want to learn?").fill(subject);
  await page.getByRole("button", { name: `Begin learning ${subject}` }).click();
  await page.getByRole("heading", { name: "Find a starting point" }).waitFor();
}

async function finishLesson(page, response) {
  const continueButton = page.getByRole("button", {
    name: "Continue",
    exact: true,
  });
  await continueButton.click();
  await page.getByRole("heading", { name: "Try it for yourself" }).waitFor();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("heading", { name: "Bring it back" }).waitFor();
  const finish = page.getByRole("button", { name: "Finish lesson" });
  assert.equal(
    await finish.isDisabled(),
    true,
    "A response is required before finishing",
  );
  await page.getByLabel("What do you remember or notice?").fill(response);
  await finish.click();
  await page
    .getByRole("heading", { name: /A new star in Sketching/ })
    .waitFor();
  await page.getByRole("button", { name: "Back to your sky" }).click();
}

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
  await new Promise((resolve) => server.listen(3112, "127.0.0.1", resolve));
  const browser = await chromium.launch({
    executablePath: chromiumPath(),
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1365, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:3112/breadcrumbs/");
    await page.locator(".survey").waitFor();
    await answerSurvey(page);

    for (const [count, response] of [
      [1, "I noticed the mug is made from a few simple shapes."],
      [2, "I would change the handle after seeing how it curves."],
    ]) {
      await startLesson(page, "Sketching");
      await finishLesson(page, response);
      const skyButton = page.getByRole("button", {
        name: `Explore Sketching constellation, ${count} completed lesson${count === 1 ? "" : "s"}`,
      });
      await skyButton.waitFor();
      assert.equal(
        await skyButton.locator(".constellation-drawing line").count(),
        count - 1,
        "Stars connect only after the second completion",
      );
      const stored = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("breadcrumbs-v1")),
      );
      assert.equal(
        stored.skills.find((skill) => skill.name === "Sketching").sessions,
        count,
      );
      assert.equal(
        stored.notes.filter((note) => note.skill === "Sketching").length,
        count,
      );
    }
    await page.reload();
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("breadcrumbs-v1")),
    );
    assert.equal(
      stored.skills.find((skill) => skill.name === "Sketching").sessions,
      2,
      "Completed stars survive reload",
    );
    assert.equal(
      stored.notes.filter((note) => note.skill === "Sketching").length,
      2,
    );
    await page
      .getByRole("button", {
        name: "Explore Sketching constellation, 2 completed lessons",
      })
      .click();
    await page
      .getByRole("heading", { name: "Sketching", exact: true })
      .waitFor();
    const history = page.getByRole("list", {
      name: "Completed lessons in Sketching",
    });
    assert.equal(await history.getByRole("button").count(), 2);
    await history.getByRole("button").first().click();
    await page.locator(".summary").waitFor();
    await page.locator("blockquote").waitFor();
    await page.getByRole("button", { name: "Back to Sketching" }).click();
    await page.getByRole("button", { name: "Back to your sky" }).click();
    await page.getByRole("button", { name: "Learning settings" }).click();
    await page.getByRole("button", { name: "Retake the survey" }).click();
    await answerSurvey(page);
    const afterSurvey = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("breadcrumbs-v1")),
    );
    assert.equal(
      afterSurvey.skills.find((skill) => skill.name === "Sketching").sessions,
      2,
      "Retaking the survey preserves completed lesson history",
    );
    assert.equal(
      afterSurvey.notes.filter((note) => note.skill === "Sketching").length,
      2,
    );

    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      true,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "No horizontal overflow on mobile",
    );
    await startLesson(page, "Sketching");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "Lesson fits mobile viewport",
    );
    await page.getByRole("button", { name: "Back to your sky" }).click();
    await fs.mkdir("work/pages", { recursive: true });
    await page.screenshot({
      path: "work/pages/static-mobile.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    assert(
      !requests.some((url) => url.includes("/api/")),
      "A static Pages build must not request local API routes",
    );
    assert(
      requests.some(
        (url) => url.startsWith("/breadcrumbs/assets/") && url.endsWith(".js"),
      ),
    );
    console.log(
      "PASS: static Pages path, six-step survey, two lessons/stars, history, reload, survey retake, mobile layout, and reduced-motion transitions all work without local API requests.",
    );
    await context.close();
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
