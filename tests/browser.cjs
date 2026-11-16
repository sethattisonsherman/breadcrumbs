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
    page.on("pageerror", (e) => errors.push(e.message));
    await fs.mkdir("work", { recursive: true });
    await page.goto(origin);
    await page.getByText("Garden saved to your database").waitFor();
    await page.screenshot({ path: "work/desktop.png", fullPage: true });
    await page
      .getByRole("button", { name: "Find my path", exact: true })
      .click();
    await page.getByLabel("I’d love to learn…").fill("Biology");
    await page.getByRole("button", { name: "Follow this path" }).click();
    await page.getByRole("button", { name: "Learn & understand" }).click();
    await page.getByRole("button", { name: "Follow this path" }).click();
    await page.getByRole("button", { name: "Read & reflect" }).click();
    await page.getByRole("button", { name: "Follow this path" }).click();
    await page.getByRole("button", { name: /2 minutes/ }).click();
    await page.getByRole("button", { name: "Follow this path" }).click();
    await page
      .getByPlaceholder("A little dream to grow toward…")
      .fill("Understand the life around me");
    await page.getByRole("button", { name: "Find my first step" }).click();
    await page.getByRole("button", { name: "Plant my skill" }).waitFor();
    await page.screenshot({ path: "work/adventure.png" });
    await page.getByRole("button", { name: "Plant my skill" }).click();
    await page
      .getByRole("heading", { name: "Your curiosity, taking root." })
      .waitFor();
    await page.getByText("Garden saved to your database").waitFor();
    await page
      .getByRole("button", { name: "Take a little step", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Make one idea in Biology stick" })
      .waitFor();
    assert(
      await page
        .getByRole("button", { name: "I took this little step" })
        .isDisabled(),
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
    await page.getByRole("button", { name: "Back to my garden" }).click();
    await page.getByText("Garden saved to your database").waitFor();
    let stored = await (await context.request.get(origin + "/api/user")).json();
    assert.equal(stored.storage, "postgresql");
    assert.equal(stored.state.skills[0].sessions, 1);
    assert.equal(stored.state.skills[0].confidence, 1);
    assert.equal(stored.state.notes.length, 1);
    assert.equal(stored.state.skills[0].minutes, 2);
    assert.match(stored.state.notes[0].text, /organelles/);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByText("Garden saved to your database").waitFor();
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
      await page.getByRole("button", { name: "Today", exact: true }).click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `Overflow at ${width}`,
      );
      if (width === 390)
        await page.screenshot({ path: "work/mobile.png", fullPage: true });
      await page.getByRole("button", { name: /^My skill garden/ }).click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `Garden overflow at ${width}`,
      );
    }
    await page.getByRole("button", { name: "Plant a new skill" }).click();
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
      "PASS: onboarding, practice, reflections, PostgreSQL restoration, session isolation, keyboard dismissal, and 5 responsive widths.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
