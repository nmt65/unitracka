import { test, expect } from "@playwright/test";

async function login(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Intră în platformă" }).click();
  await page.getByLabel("Email").fill("andrei@unitracker.ro");
  await page.locator('input[name="password"]').fill("Demo1234!");
  await page.getByRole("button", { name: "Intră în cont", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Bună, Andrei/ })).toBeVisible();
}

test("studentul se autentifică și parcurge funcțiile principale", async ({ page }) => {
  await login(page);

  const profileButton = page.getByRole("button", { name: /Andrei Mihai Student/ });
  if (await profileButton.isVisible()) {
    await profileButton.click();
  } else {
    await page.getByRole("button", { name: "Mai mult" }).click();
    await page.getByRole("button", { name: "Profil" }).click();
  }
  await expect(page.getByRole("heading", { name: "Profilul meu" })).toBeVisible();

  const universityNav = page.getByRole("button", { name: "Universități" }).last();
  await universityNav.click();
  await expect(page.getByRole("heading", { name: "Universități" })).toBeVisible();

  const documentsNav = page.getByRole("button", { name: "Documente" }).last();
  await documentsNav.click();
  await expect(page.getByRole("heading", { name: "Documente", exact: true })).toBeVisible();
});

test("pagina publică este accesibilă și fără overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dosarul tău universitar, de la alegere la admitere." })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  await page.getByRole("button", { name: "Creează cont" }).click();
  await expect(page.getByRole("heading", { name: "Creează cont" })).toBeVisible();
});

test("notificările se închid la click exterior", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Notificări" }).click();
  await expect(page.locator(".notification-panel")).toBeVisible();
  await page.locator("main.content").click({ position: { x: 12, y: 12 }, force: true });
  await expect(page.locator(".notification-panel")).toHaveCount(0);
});
