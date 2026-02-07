import { expect, test } from '@playwright/test';

const password = '123456';

async function registerAndLogin(page: import('@playwright/test').Page, username: string) {
  await page.goto('/login');
  await page.getByTestId('auth-switch-mode').click();
  await page.getByTestId('auth-username').fill(username);
  await page.getByTestId('auth-password').fill(password);
  await page.getByTestId('auth-confirm-password').fill(password);
  await page.getByTestId('auth-submit').click();
  await page.waitForURL(/\/(tabs|library|stats|settings|$)/, { timeout: 20_000 });
}

test.describe.serial('MyGymApp key flows', () => {
  test('exercise click updates stats, clear resets stats, visual and text exist', async ({ page, context }) => {
    const username = `e2e_${Date.now()}_a`;

    await context.clearCookies();
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await registerAndLogin(page, username);

    await page.goto('/stats');
    await expect(page.getByTestId('stats-total-stands')).toHaveText('0');

    await page.goto('/library');
    const firstCard = page.getByTestId('exercise-card-neck_tuck');
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    await page.goto('/stats');
    await expect(page.getByTestId('stats-total-stands')).toHaveText('1');

    await page.goto('/settings');
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.getByTestId('clear-today-progress').click();

    await page.goto('/stats');
    await expect(page.getByTestId('stats-total-stands')).toHaveText('0');

    await page.goto('/library');
    await expect(page.getByTestId('exercise-visual-neck_tuck-step-1')).toBeVisible();
    await expect(page.getByTestId('exercise-title-neck_tuck')).toBeVisible();
    await expect(page.getByTestId('exercise-desc-neck_tuck')).toBeVisible();
    await expect(page.getByTestId('exercise-tip-neck_tuck')).toBeVisible();
    await expect(page.getByTestId('exercise-visual-neck_tuck-step-1-caption')).toBeVisible();
  });

  test('plus button updates stats for same user session', async ({ page, context }) => {
    const username = `e2e_${Date.now()}_b`;

    await context.clearCookies();
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await registerAndLogin(page, username);

    await page.goto('/library');
    await expect(page.getByTestId('exercise-plus-neck_tuck')).toBeVisible();
    await page.getByTestId('exercise-plus-neck_tuck').click();

    await page.goto('/stats');
    await expect(page.getByTestId('stats-total-stands')).toHaveText('1');
  });
});
