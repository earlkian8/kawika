import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, makeUser, registerViaApi, test } from '../support/fixtures'

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)
}

test.describe('Accessibility (axe, WCAG 2.2 AA)', () => {
  test('login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Tara, magpatuloy.' })).toBeVisible()
    await page.waitForTimeout(900) // let the banderitas settle
    expect(await seriousViolations(page)).toEqual([])
  })

  test('register page with validation errors', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText('Enter a valid email address.')).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])
  })

  test('login error state', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email or username').fill(makeUser().email)
    await page.getByLabel('Password', { exact: true }).fill('wrong password here')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByRole('alert')).toContainText('incorrect')
    expect(await seriousViolations(page)).toEqual([])
  })

  test('home with a quest and the account menu open', async ({ page }) => {
    await registerViaApi(page)
    await page.goto('/home')
    await page.getByRole('button', { name: 'Continue quest' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])
  })
})
