const { test, expect, beforeEach, describe } = require("@playwright/test");

describe("Blog app", () => {
  beforeEach(async ({ page, request }) => {
    await request.post("http://localhost:3003/api/testing/reset");
    await request.post("http://localhost:3003/api/users", {
      data: {
        name: "Matti Luukkainen",
        username: "mluukkai",
        password: "salainen",
      },
    });

    await page.goto("http://localhost:5173");
  });

  test("Login form is shown", async ({ page }) => {
    const locator = await page.getByText("Login to application to view blogs");
    await expect(locator).toBeVisible();
  });

  describe("Login", () => {
    test("succeeds with correct credentials", async ({ page }) => {
      await page.getByTestId("username").fill("mluukkai");
      await page.getByTestId("password").fill("salainen");
      await page.getByRole("button", { name: "Login" }).click();

      await expect(
        page.getByText("logged in as Matti Luukkainen")
      ).toBeVisible();
    });

    test("fails with wrong credentials", async ({ page }) => {
      await page.getByTestId("username").fill("mluukkai");
      await page.getByTestId("password").fill("salainennn");

      await page.getByRole("button", { name: "Login" }).click();

      await expect(
        page.getByText("logged in as Matti Luukkainen")
      ).not.toBeVisible();
    });
  });

  describe("when logged in", () => {
    beforeEach(async ({ page }) => {
      await page.getByTestId("username").fill("mluukkai");
      await page.getByTestId("password").fill("salainen");
      await page.getByRole("button", { name: "Login" }).click();
    });

    test("a new blog can be created", async ({ page }) => {
      await page.getByRole("button", { name: "Create a new blog" }).click();
      await page.getByTestId("title").fill("this is note to test");
      await page.getByTestId("author").fill("Sean Jin");
      await page.getByTestId("url").fill("www.google.ca");
      await page.getByRole("button", { name: "submit" }).click();
      await expect(
        page.getByText("this is note to test - Sean Jin")
      ).toBeVisible();
    });
  });
});
