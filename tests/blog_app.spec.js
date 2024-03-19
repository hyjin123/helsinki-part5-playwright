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

    await request.post("http://localhost:3003/api/users", {
      data: {
        name: "Sean Jin",
        username: "seanjin",
        password: "secret",
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
        page.getByText("New Blog: this is note to test has been added!")
      ).toBeVisible();
      await expect(
        page.getByText("this is note to test - Sean Jin")
      ).toBeVisible();
    });

    describe("and a blog exists", () => {
      beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: "Create a new blog" }).click();
        await page.getByTestId("title").fill("this is note to test");
        await page.getByTestId("author").fill("Sean Jin");
        await page.getByTestId("url").fill("www.google.ca");
        await page.getByRole("button", { name: "submit" }).click();
      });

      test("blog can be edited", async ({ page }) => {
        await page.getByRole("button", { name: "view" }).click();
        await page.getByRole("button", { name: "like" }).click();
        await expect(page.getByText("You liked a blog!")).toBeVisible();
        await expect(page.getByText("likes: 1")).toBeVisible();
      });

      test("blog can be deleted", async ({ page }) => {
        await page.getByRole("button", { name: "view" }).click();

        // set the dialog before clicking on the remove button or the test fails
        page.on("dialog", async (dialog) => {
          expect(dialog.message()).toContain(
            "Remove blog this is note to test by Sean Jin"
          );
          await dialog.accept();
        });

        await page.getByRole("button", { name: "remove" }).click();

        await expect(
          page.getByText(
            "Blog: this is note to test by Sean Jin has been deleted!"
          )
        ).toBeVisible();
        await expect(
          page.getByText("this is note to test - Sean Jin")
        ).not.toBeVisible();
      });

      test("only creator can see the remove button", async ({ page }) => {
        await page.getByRole("button", { name: "view" }).click();
        await expect(page.getByText("remove")).toBeVisible();

        // log out and log in with a different user
        await page.getByRole("button", { name: "logout" }).click();
        await page.getByTestId("username").fill("seanjin");
        await page.getByTestId("password").fill("secret");
        await page.getByRole("button", { name: "Login" }).click();

        // check to see that the new user cannot see the remove button
        await page.getByRole("button", { name: "view" }).click();
        await expect(page.getByText("remove")).not.toBeVisible();
      });

      describe("2 different blogs exists", () => {
        beforeEach(async ({ page }) => {
          // 2nd blog
          await page.getByRole("button", { name: "Create a new blog" }).click();
          await page.getByTestId("title").fill("2nd");
          await page.getByTestId("author").fill("Sean Jin");
          await page.getByTestId("url").fill("www.google.ca");
          await page.getByRole("button", { name: "submit" }).click();
        });

        test("blogs are in the order of most likes", async ({ page }) => {
          // by default, the first blog has 0 like
          // like the 2nd blog once and hide the box
          await page.locator(':nth-match(:text("view"), 2)').click();
          await page.getByRole("button", { name: "like" }).click();
          await page.getByRole("button", { name: "hide" }).click();

          // click the first view button, it should have 1 like
          await page.locator(':nth-match(:text("view"), 1)').click();
          await expect(page.getByText("likes: 1")).toBeVisible();
          await page.getByRole("button", { name: "hide" }).click();

          // click the second view button, it should have 0 likes
          await page.locator(':nth-match(:text("view"), 2)').click();
          await expect(page.getByText("likes: 0")).toBeVisible();
        });
      });
    });
  });
});
