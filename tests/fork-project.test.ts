import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await expect(page.locator("section")).toMatchAriaSnapshot(`
    - heading "Pages in Storybook" [level=2]
    - paragraph:
      - text: We recommend building UIs with a
      - link "component-driven":
        - /url: https://componentdriven.org
        - strong: component-driven
      - text: process starting with atomic components and ending with pages.
    - paragraph: "Render pages with mock data. This makes it easy to build and review page states without needing to navigate to them in your app. Here are some handy patterns for managing page data in Storybook:"
    - list:
      - listitem: Use a higher-level connected component. Storybook helps you compose such data from the "args" of child component stories
      - listitem: Assemble data in the page component from your services. You can mock these services out using Storybook.
    - paragraph:
      - text: Get a guided tutorial on component-driven development at
      - link "Storybook tutorials":
        - /url: https://storybook.js.org/tutorials/
      - text: . Read more in the
      - link "docs":
        - /url: https://storybook.js.org/docs
      - text: .
    - text: Tip Adjust the width of the canvas with the
    - img
    - text: Viewports addon in the toolbar
    `);
});
