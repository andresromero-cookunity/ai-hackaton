import type { Page } from 'playwright';

const CLOSE_SELECTORS = [
  '[aria-label="Close"]',
  '[aria-label="close"]',
  '[data-testid*="close"]',
  '.modal [class*="close"]',
  '.popup [class*="close"]',
  '.newsletter-popup button',
  'button:has-text("No thanks")',
  'button:has-text("No, thanks")',
  'button:has-text("Not now")',
  'button:has-text("Skip")',
  'button:has-text("Close")'
];

export async function closeKnownPopups(page: Page): Promise<void> {
  for (const selector of CLOSE_SELECTORS) {
    try {
      const element = page.locator(selector).first();
      const visible = await element.isVisible({ timeout: 500 });
      if (visible) {
        await element.click({ timeout: 1000 });
      }
    } catch {
      // Ignore missing or unclickable elements.
    }
  }

  try {
    await page.keyboard.press('Escape');
  } catch {
    // Ignore keyboard issues.
  }
}
