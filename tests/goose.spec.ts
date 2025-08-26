import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page
    .getByRole("link", { name: "chromium Created Aug 25, 2025" })
    .click();
  const loc = page.getByText("Sandbox:Connecting...");
  await expect(loc).toBeVisible();
  await page.request.post("http://localhost:3000/api/projects/1/resume", {
    headers: {
      "sec-ch-ua-platform": '"Windows"',
      Referer: "http://localhost:3000/projects/1",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.7339.16 Safari/537.36",
      "sec-ch-ua":
        '"Chromium";v="140", "Not=A?Brand";v="24", "HeadlessChrome";v="140"',
      "Accept-Language": "en-US",
      "sec-ch-ua-mobile": "?0",
    },
  });
  const loc2 = page.getByText("Goose WebServer:running");
  await expect(loc2).toBeVisible();
});
