const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { expect, test } = require("@playwright/test");


const repoRoot = path.resolve(__dirname, "..");


function startStaticServer(root) {
  const contentTypes = {
    ".css": "text/css",
    ".html": "text/html; charset=utf-8",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url, "http://127.0.0.1");
    let requestPath = decodeURIComponent(requestUrl.pathname);
    if (requestPath.endsWith("/")) {
      requestPath += "index.html";
    }
    const filePath = path.resolve(root, `.${requestPath}`);
    if (!filePath.startsWith(`${path.resolve(root)}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }
    fs.readFile(filePath, (error, contents) => {
      if (error) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, {
        "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
      });
      response.end(contents);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}


test("desktop gallery opens, counts, closes, and restores focus", async ({ page }) => {
  await page.goto("/");
  const items = page.locator(".gallery-item");
  const itemCount = await items.count();
  expect(itemCount).toBeGreaterThan(0);

  const selected = items.nth(2);
  const selectedImage = await selected.getAttribute("data-full");
  const selectedIndex = (await selected.locator(".work-number").innerText()).trim();
  await selected.click();
  const dialog = page.locator("#gallery-lightbox");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".lightbox-image")).toHaveAttribute(
    "src",
    selectedImage,
  );
  await expect(dialog.locator(".lightbox-count")).toHaveText(
    `${selectedIndex} / ${String(itemCount).padStart(2, "0")}`,
  );

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(selected).toBeFocused();
});


test("mobile layout has no horizontal overflow and every revealed image loads", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const itemCount = await page.locator(".gallery-item").count();
  expect(itemCount).toBeGreaterThan(0);
  const images = page.locator(".gallery-image");
  await expect(images).toHaveCount(itemCount);
  for (let index = 0; index < itemCount; index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(
      () => image.evaluate((node) => node.complete && node.naturalWidth > 0),
    ).toBe(true);
  }
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});


test("gallery thumbnail ratio follows the image orientation", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const images = page.locator(".gallery-image");
    const imageCount = await images.count();
    let landscapeCount = 0;
    let portraitCount = 0;

    for (let index = 0; index < imageCount; index += 1) {
      const image = images.nth(index);
      await image.scrollIntoViewIfNeeded();
      await expect.poll(
        () => image.evaluate((node) => node.complete && node.naturalWidth > 0),
      ).toBe(true);

      const frame = await image.evaluate((node) => {
        const item = node.closest(".gallery-item");
        return {
          classes: Array.from(node.classList),
          height: node.offsetHeight,
          isLandscape: node.naturalWidth > node.naturalHeight,
          itemHeight: item.offsetHeight,
          width: node.offsetWidth,
        };
      });
      const expectedClass = frame.isLandscape ? "is-landscape" : "is-portrait";
      const expectedRatio = frame.isLandscape ? 4 / 3 : 3 / 4;

      landscapeCount += frame.isLandscape ? 1 : 0;
      portraitCount += frame.isLandscape ? 0 : 1;
      expect(frame.classes).toContain(expectedClass);
      expect(frame.width / frame.height).toBeCloseTo(expectedRatio, 2);
      expect(Math.abs(frame.itemHeight - frame.height)).toBeLessThanOrEqual(1);
    }

    expect(landscapeCount).toBeGreaterThan(0);
    expect(portraitCount).toBeGreaterThan(0);

    await page.locator(".gallery-item").first().click();
    await expect(page.locator("#gallery-lightbox")).toBeVisible();
    await expect.poll(
      () => page.locator(".lightbox-image").evaluate((image) => getComputedStyle(image).objectFit),
    ).toBe("contain");
    await page.keyboard.press("Escape");
  }
});


test("reduced motion disables smooth scrolling and long transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const styles = await page.evaluate(() => ({
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    transitionDuration: getComputedStyle(document.querySelector(".gallery-image")).transitionDuration,
  }));
  expect(styles.scrollBehavior).toBe("auto");
  expect(Number.parseFloat(styles.transitionDuration)).toBeLessThanOrEqual(0.00001);
});


test("an additional work remains reachable and updates the lightbox count", async ({ page }) => {
  await page.goto("/");
  const baselineCount = await page.locator(".gallery-item").count();
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-nine-"));
  const source = path.join(temporaryRoot, "source");
  const destination = path.join(temporaryRoot, "site");
  const excludedRoots = new Set([
    ".bundle",
    ".git",
    ".superpowers",
    ".worktrees",
    "_site",
    "node_modules",
    "vendor",
  ]);
  fs.cpSync(repoRoot, source, {
    recursive: true,
    filter: (sourcePath) => {
      const relative = path.relative(repoRoot, sourcePath);
      const rootName = relative.split(path.sep)[0];
      return !excludedRoots.has(rootName);
    },
  });
  fs.writeFileSync(
    path.join(source, "_works/09-browser-fixture.md"),
    `---
title: Browser Fixture
category: photography
image: "/assets/images/works/photo-01.jpeg"
alt: "Ninth browser fixture work"
description: ""
location: ""
visible: true
---
`,
    "utf8",
  );

  let server;
  try {
    execFileSync(
      "bundle",
      ["exec", "jekyll", "build", "--strict_front_matter", "--destination", destination],
      {
        cwd: source,
        env: { ...process.env, BUNDLE_GEMFILE: path.join(repoRoot, "Gemfile") },
        stdio: "pipe",
      },
    );
    const fixture = await startStaticServer(destination);
    server = fixture.server;
    await page.goto(fixture.url);

    const items = page.locator(".gallery-item");
    const expectedCount = baselineCount + 1;
    await expect(items).toHaveCount(expectedCount);
    const fixtureItem = page.locator('[data-title="Browser Fixture"]');
    const fixtureIndex = (await fixtureItem.locator(".work-number").innerText()).trim();
    await fixtureItem.click();
    await expect(page.locator(".lightbox-count")).toHaveText(
      `${fixtureIndex} / ${String(expectedCount).padStart(2, "0")}`,
    );
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
