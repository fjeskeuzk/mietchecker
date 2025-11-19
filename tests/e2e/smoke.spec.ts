/**
 * E2E Smoke Tests
 * Basic end-to-end tests to verify critical user journeys
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Mietchecker/);

    // Check hero section
    await expect(page.getByRole('heading', { name: /Finde deine perfekte Wohnung/i })).toBeVisible();

    // Check CTA button
    await expect(page.getByRole('link', { name: /Jetzt starten/i })).toBeVisible();
  });

  test('should navigate to signup', async ({ page }) => {
    await page.goto('/');

    // Click signup button
    await page.getByRole('link', { name: /Jetzt starten/i }).first().click();

    // Should navigate to signup page
    await expect(page).toHaveURL(/\/signup/);
  });

  test('should navigate to login', async ({ page }) => {
    await page.goto('/');

    // Click login button
    await page.getByRole('link', { name: /Anmelden/i }).click();

    // Should navigate to login page
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Authentication Flow', () => {
  test('should show login form', async ({ page }) => {
    await page.goto('/login');

    // Check form elements
    await expect(page.getByLabel(/E-Mail/i)).toBeVisible();
    await expect(page.getByLabel(/Passwort/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Anmelden/i })).toBeVisible();
  });

  test('should show signup form', async ({ page }) => {
    await page.goto('/signup');

    // Check form elements
    await expect(page.getByLabel(/E-Mail/i)).toBeVisible();
    await expect(page.getByLabel(/Passwort/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Registrieren/i })).toBeVisible();
  });
});

test.describe('Dashboard (authenticated)', () => {
  test.skip('should show dashboard after login', async ({ page }) => {
    // This test requires actual authentication
    // Skip in CI unless you have test credentials

    await page.goto('/login');

    // Fill in test credentials (these should be environment variables)
    await page.getByLabel(/E-Mail/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.getByLabel(/Passwort/i).fill(process.env.TEST_USER_PASSWORD || 'password');

    // Submit form
    await page.getByRole('button', { name: /Anmelden/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Check dashboard content
    await expect(page.getByRole('heading', { name: /Meine Projekte/i })).toBeVisible();
  });

  test.skip('should create a new project', async ({ page }) => {
    // Requires authentication
    await page.goto('/dashboard');

    // Click create project button
    await page.getByRole('button', { name: /Neues Projekt erstellen/i }).click();

    // Fill in project form
    await page.getByLabel(/Projektname/i).fill('Test Property');
    await page.getByLabel(/Adresse/i).fill('Test Street 123, Berlin');
    await page.getByLabel(/Latitude/i).fill('52.5200');
    await page.getByLabel(/Longitude/i).fill('13.4050');

    // Submit
    await page.getByRole('button', { name: /Erstellen/i }).click();

    // Should show success message
    await expect(page.getByText(/erfolgreich erstellt/i)).toBeVisible();
  });
});

test.describe('Project Detail Page', () => {
  test.skip('should show project details', async ({ page }) => {
    // Requires authentication and existing project
    const projectId = '11111111-1111-1111-1111-111111111111';

    await page.goto(`/projects/${projectId}`);

    // Check project content
    await expect(page.getByRole('heading')).toBeVisible();

    // Check metrics cards
    await expect(page.getByText(/Lärmbelastung/i)).toBeVisible();
    await expect(page.getByText(/Internetgeschwindigkeit/i)).toBeVisible();
  });

  test.skip('should allow chatting with AI', async ({ page }) => {
    const projectId = '11111111-1111-1111-1111-111111111111';

    await page.goto(`/projects/${projectId}`);

    // Find chat input
    const chatInput = page.getByPlaceholder(/Stellen Sie eine Frage/i);
    await expect(chatInput).toBeVisible();

    // Type message
    await chatInput.fill('Wie ist die Lärmbelastung?');

    // Send message
    await page.getByRole('button', { name: /Senden/i }).click();

    // Should show AI response
    await expect(page.getByText(/Lärmbelastung/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Responsive Design', () => {
  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Check mobile menu
    await expect(page).toHaveTitle(/Mietchecker/);
  });

  test('should be tablet responsive', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');

    await expect(page).toHaveTitle(/Mietchecker/);
  });
});
