const { chromium } = require("playwright-core");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const origin = process.env.TEST_ORIGIN || "http://127.0.0.1:3000";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1080 },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    let planRequests = 0;
    page.on("request", (r) => {
      if (r.url().endsWith("/api/plan") && r.method() === "POST")
        planRequests++;
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await fs.mkdir("work", { recursive: true });
    await page.goto(origin);
    await page.getByText("Your universe is saved").waitFor();
    await page
      .getByRole("heading", { name: "How does your curiosity work?" })
      .waitFor();
    await page.screenshot({ path: "work/survey.png" });
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page.screenshot({ path: "work/desktop.png", fullPage: true });
    assert.equal(await page.locator(".skill-cluster").count(), 3);
    await page
      .getByRole("button", { name: "Find my first constellation", exact: true })
      .click();
    await page.getByRole("button", { name: "Read & reflect" }).click();
    await page.getByRole("button", { name: "Follow this path" }).click();
    await page.getByLabel("I’d love to learn…").fill("Biology");
    await page.getByRole("button", { name: "Follow this path" }).click();
    await page.getByRole("button", { name: "Learn & understand" }).click();
    await page.getByRole("button", { name: "Follow this path" }).click();
    await page.getByRole("button", { name: /2 minutes/ }).click();
    await page.getByRole("button", { name: "Follow this path" }).click();
    await page
      .getByPlaceholder("A little dream to grow toward…")
      .fill("Understand the life around me");
    await page.getByRole("button", { name: "Find my first step" }).click();
    await page.getByRole("button", { name: "Light my first star" }).waitFor();
    await page.screenshot({ path: "work/adventure.png" });
    await page.getByRole("button", { name: "Light my first star" }).click();
    await page.getByRole("heading", { name: "Biology", exact: true }).waitFor();
    await page.getByText("Your universe is saved").waitFor();
    await page
      .getByRole("button", { name: "Take this little step", exact: true })
      .waitFor({ state: "visible" });
    await page.screenshot({ path: "work/constellation.png", fullPage: true });
    const beforeStart = planRequests;
    await page
      .getByRole("button", { name: "Take this little step", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("heading", { name: "Make one idea in Biology stick" })
      .waitFor();
    assert(
      await page
        .getByRole("button", { name: "I took this little step" })
        .isDisabled(),
    );
    assert.equal(
      planRequests,
      beforeStart,
      "Starting practice must reuse the preview task",
    );
    const steps = page.locator(".practice-steps>button");
    for (let i = 0; i < 3; i++) await steps.nth(i).click();
    await page
      .getByLabel("Your explanation, from memory")
      .fill(
        "Cells are the smallest living units. A cell membrane controls what can enter and leave.",
      );
    await page.getByRole("button", { name: "I took this little step" }).click();
    await page.getByRole("button", { name: "Feeling confident" }).click();
    await page
      .locator("#reflection")
      .fill("Next time I want to recall the organelles without looking.");
    await page.getByRole("button", { name: "Save this little win" }).click();
    await page
      .getByRole("button", { name: "Back to my constellation" })
      .click();
    await page.getByText("Your universe is saved").waitFor();
    let stored = await (await context.request.get(origin + "/api/user")).json();
    assert.equal(stored.storage, "postgresql");
    assert.equal(stored.state.skills[0].sessions, 1);
    assert.equal(stored.state.skills[0].confidence, 1);
    assert.equal(stored.state.notes.length, 1);
    assert.equal(stored.state.skills[0].minutes, 2);
    assert.match(stored.state.notes[0].text, /organelles/);
    await page.getByRole("button", { name: "Back to your universe" }).click();
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    assert.match(await page.locator(".map-controls").innerText(), /115%/);
    const sky = page.locator(".universe");
    const box = await sky.boundingBox();
    await sky.focus();
    await page.keyboard.press("ArrowRight");
    assert.match(
      await page.locator(".space-world").getAttribute("style"),
      /-80px/,
    );
    await page.getByRole("button", { name: "Reset universe view" }).click();
    assert.match(await page.locator(".map-controls").innerText(), /100%/);
    await page
      .getByRole("button", { name: "Explore Biology constellation" })
      .click();
    await page
      .getByRole("button", { name: "Practice the next star in Biology" })
      .click();
    await page
      .getByRole("button", { name: "Leave this for another day" })
      .click();
    assert.equal(await page.getByRole("dialog").count(), 0);
    const afterDefer = await (
      await context.request.get(origin + "/api/user")
    ).json();
    assert.equal(afterDefer.state.skills[0].sessions, 1);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByText("Your universe is saved").waitFor();
    await page
      .getByRole("button", { name: "Field notes", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Make one idea in Biology stick" })
      .waitFor();
    assert.match(await page.locator(".note-card>p").innerText(), /organelles/);
    const other = await browser.newContext();
    const result = await (await other.request.get(origin + "/api/user")).json();
    assert.equal(result.state, null);
    await other.close();
    for (const width of [1440, 1024, 768, 390, 360]) {
      await page.setViewportSize({ width, height: 900 });
      await page
        .getByRole("button", { name: "Your universe", exact: true })
        .click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `Overflow at ${width}`,
      );
      if (width === 390)
        await page.screenshot({ path: "work/mobile.png", fullPage: true });
      await page
        .getByRole("button", { name: "Explore Biology constellation" })
        .click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `Garden overflow at ${width}`,
      );
    }
    await page.route("**/api/plan", (route) =>
      route.fulfill({
        json: {
          title: "Recall a cell structure",
          description: "One small recall check.",
          steps: [
            "Name the structure that holds genetic instructions in a typical animal cell.",
            "Type your best answer without opening your notes.",
            "Reveal the check after your attempt, compare, and stop.",
          ],
          method: "Retrieval",
          reflection: "What helped you recall it?",
          estimated_seconds: 60,
          expected_answer: "The nucleus.",
          source: "ai",
        },
      }),
    );
    await page
      .getByRole("button", { name: "Your universe", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Explore Biology constellation" })
      .click();
    await page
      .getByRole("heading", { name: "Recall a cell structure", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Take this little step", exact: true })
      .click();
    assert.equal(
      await page.getByText("The nucleus.", { exact: true }).count(),
      0,
    );
    assert(
      await page
        .getByRole("button", { name: "Reveal the answer check" })
        .isDisabled(),
    );
    await page.locator("#practice-output").fill("I think it is the nucleus.");
    await page.getByRole("button", { name: "Reveal the answer check" }).click();
    await page.getByText("The nucleus.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page.unroute("**/api/plan");
    await page
      .getByRole("button", { name: "Your universe", exact: true })
      .click();
    await page.getByRole("button", { name: "Discover a skill" }).click();
    await page.screenshot({ path: "work/mobile-adventure.png" });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: onboarding, practice, reflections, PostgreSQL restoration, session isolation, deferral, cached task previews, gated retrieval checks, galaxy zoom and keyboard navigation, keyboard dismissal, and 5 responsive widths.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
