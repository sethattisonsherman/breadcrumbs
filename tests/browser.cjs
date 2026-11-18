const { chromium } = require("playwright-core");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const origin = process.env.TEST_ORIGIN || "http://127.0.0.1:3000";

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
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("heading", { name: "Try it for yourself" }).waitFor();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("heading", { name: "Bring it back" }).waitFor();
  const finish = page.getByRole("button", { name: "Finish lesson" });
  assert.equal(await finish.isDisabled(), true);
  await page.getByLabel("What do you remember or notice?").fill(response);
  await finish.click();
  await page
    .getByRole("heading", { name: "A new star in Sketching." })
    .waitFor();
  await page.getByRole("button", { name: "Back to your sky" }).click();
}

(async () => {
  const browser = await chromium.launch({
    executablePath: chromiumPath(),
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    let planRequests = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/api/plan") && request.method() === "POST")
        planRequests++;
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await fs.mkdir("work", { recursive: true });
    await page.route("**/api/plan", async (route) => {
      await route.fulfill({
        json: {
          title: "A small sketching practice",
          description: "Make one small sketch and notice its shapes.",
          steps: [
            "Choose one simple object and notice its outline.",
            "Sketch it with a few basic shapes.",
            "Recall what you noticed and what you would change.",
          ],
          method: "Practice",
          reflection: "What would you try next?",
          estimated_seconds: 120,
          source: "ai",
        },
      });
    });
    await page.goto(origin);
    await page.locator(".survey").waitFor();
    await page.screenshot({ path: "work/survey.png" });
    await answerSurvey(page);

    await startLesson(page, "Sketching");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("heading", { name: "Try it for yourself" }).waitFor();
    await page.getByRole("button", { name: "Back to your sky" }).click();
    await page
      .getByRole("button", { name: "Continue your lesson in Sketching" })
      .click();
    await page.getByRole("heading", { name: "Try it for yourself" }).waitFor();
    assert.equal(
      planRequests,
      1,
      "Resuming an in-progress lesson reuses its saved plan",
    );
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("heading", { name: "Bring it back" }).waitFor();
    const finish = page.getByRole("button", { name: "Finish lesson" });
    assert.equal(await finish.isDisabled(), true);
    await page
      .getByLabel("What do you remember or notice?")
      .fill("A circle and a few straight lines make a useful start.");
    await finish.click();
    await page
      .getByRole("heading", { name: "A new star in Sketching." })
      .waitFor();
    await page.getByRole("button", { name: "Back to your sky" }).click();
    const firstSky = page.getByRole("button", {
      name: "Explore Sketching constellation, 1 completed lesson",
    });
    await firstSky.waitFor();
    assert.equal(
      await firstSky.locator(".constellation-drawing line").count(),
      0,
    );

    await startLesson(page, "Sketching");
    await finishLesson(page, "The handle curves more than I expected.");
    const secondSky = page.getByRole("button", {
      name: "Explore Sketching constellation, 2 completed lessons",
    });
    assert.equal(
      await secondSky.locator(".constellation-drawing line").count(),
      1,
    );
    await secondSky.click();
    await page
      .getByRole("heading", { name: "Sketching", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Continue learning" }).waitFor();
    const history = page.getByRole("list", {
      name: "Completed lessons in Sketching",
    });
    assert.equal(await history.getByRole("button").count(), 2);
    await history.getByRole("button").first().click();
    await page
      .getByRole("heading", { name: "A small sketching practice" })
      .waitFor();
    await page
      .getByText("The handle curves more than I expected.", { exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Back to Sketching" }).click();
    await page.getByRole("button", { name: "Back to your sky" }).click();

    const storedResponse = await (
      await context.request.get(origin + "/api/user")
    ).json();
    assert.equal(storedResponse.storage, "postgresql");
    assert.equal(
      storedResponse.state.skills.find((skill) => skill.name === "Sketching")
        .sessions,
      2,
    );
    assert.equal(
      storedResponse.state.notes.filter((note) => note.skill === "Sketching")
        .length,
      2,
    );
    assert.equal(storedResponse.state.activeLesson, null);
    assert.equal(
      planRequests,
      2,
      "Only the two newly generated lessons call the planner",
    );

    await page.getByRole("button", { name: "Learning settings" }).click();
    await page.getByRole("button", { name: "Retake the survey" }).click();
    await answerSurvey(page);
    await page.getByRole("button", { name: "Learning settings" }).click();
    await page
      .getByText(
        "Progress saved to your private browser session and this browser.",
      )
      .waitFor();
    await page.getByRole("button", { name: "Close dialog" }).click();
    const afterRetake = await (
      await context.request.get(origin + "/api/user")
    ).json();
    assert.equal(
      afterRetake.state.skills.find((skill) => skill.name === "Sketching")
        .sessions,
      2,
      "Survey retake preserves history",
    );
    assert.equal(
      afterRetake.state.notes.filter((note) => note.skill === "Sketching")
        .length,
      2,
    );
    await page.reload();
    await page
      .getByRole("button", {
        name: "Explore Sketching constellation, 2 completed lessons",
      })
      .waitFor();
    const restored = await (
      await context.request.get(origin + "/api/user")
    ).json();
    assert.equal(
      restored.state.skills.find((skill) => skill.name === "Sketching")
        .sessions,
      2,
    );

    const other = await browser.newContext();
    const isolated = await (
      await other.request.get(origin + "/api/user")
    ).json();
    assert.equal(
      isolated.state,
      null,
      "A separate browser session has isolated progress",
    );
    await other.close();

    for (const width of [1440, 1024, 768, 390, 360]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `Overflow at ${width}`,
      );
      if (width === 390)
        await page.screenshot({ path: "work/mobile.png", fullPage: true });
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: six-question survey, deterministic backend planning, midlesson resume, response gate, two persisted stars, history replay, survey retake, reload, session isolation, and responsive widths.",
    );
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
