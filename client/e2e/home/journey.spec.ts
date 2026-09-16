import { expect, registerViaApi, test } from '../support/fixtures'

test.describe('Home journey', () => {
  test.beforeEach(async ({ page }) => {
    await registerViaApi(page)
    await page.goto('/home')
    await expect(page.getByRole('button', { name: 'Continue quest' })).toBeVisible()
  })

  test('shows all five islands with the current quest called out', async ({ page }) => {
    for (const name of ['Pagbati', 'Pamilya', 'Sari-sari store', 'Sa jeepney', 'Pista']) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
    }
    await expect(page.getByText('Simulan')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Lolo at Lola. Lesson, up next' })).toBeVisible()
  })

  test('Continue quest scrolls to, focuses, and opens the current quest', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue quest' }).click()
    const current = page.getByRole('button', { name: 'Lolo at Lola. Lesson, up next' })
    await expect(current).toBeFocused()
    await expect(current).toHaveAttribute('aria-expanded', 'true')
    const dialog = page.getByRole('dialog', { name: 'Lolo at Lola' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Lesson 3 of 5')).toBeVisible()
    await expect(dialog.getByRole('button', { name: /Start/ })).toBeInViewport()
  })

  test('quest details close with Escape and with an outside click', async ({ page }) => {
    const current = page.getByRole('button', { name: 'Lolo at Lola. Lesson, up next' })
    await current.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()

    await current.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('heading', { level: 1 }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('only one quest is open at a time', async ({ page }) => {
    await page.getByRole('button', { name: 'Kumusta?. Lesson, completed' }).click()
    await expect(page.getByRole('dialog', { name: 'Kumusta?' })).toBeVisible()
    await page.getByRole('button', { name: 'Nanay at Tatay. Lesson, completed' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(1)
    await expect(page.getByRole('dialog', { name: 'Nanay at Tatay' })).toBeVisible()
  })

  test('locked and completed quests explain what they offer', async ({ page }) => {
    await page.getByRole('button', { name: 'Family tree drill. Practice, locked' }).click()
    await expect(page.getByRole('dialog')).toContainText('Finish the quests before this one to unlock it.')
    await expect(page.getByRole('dialog').getByRole('button')).toHaveCount(0)

    await page.getByRole('button', { name: 'Kumusta?. Lesson, completed' }).click()
    await expect(page.getByRole('dialog').getByRole('button', { name: /Practice again/ })).toBeVisible()
  })

  test('account menu shows who is signed in and closes with Escape', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /Account menu/ })
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('.profile__who')).toContainText('Maria Clara')
    await expect(page.locator('.profile__who')).toContainText('@mc_')
    await page.keyboard.press('Escape')
    await expect(page.locator('.profile__panel')).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('navigation marks the current page and flags unfinished sections', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Lakbay/ })).toHaveAttribute('aria-current', 'page')
    await expect(page.locator('.nav__item[aria-disabled="true"]')).toHaveCount(4)
  })

  test('streak week marks today', async ({ page }) => {
    await expect(page.locator('.streak__day--today')).toHaveCount(1)
  })

  test('works with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await page.getByRole('button', { name: 'Continue quest' }).click()
    await expect(page.getByRole('dialog', { name: 'Lolo at Lola' })).toBeVisible()
  })
})
