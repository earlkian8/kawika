import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import {
  createAccount,
  expect,
  fillLogin,
  fillRegister,
  hasHorizontalOverflow,
  makeUser,
  registerViaApi,
  test,
} from '../support/fixtures'

const toasts = (page: Page) => page.getByRole('region', { name: 'Notifications' }).getByRole('listitem')
const toast = (page: Page, title: string | RegExp) => toasts(page).filter({ hasText: title })

async function openHome(page: Page) {
  await registerViaApi(page)
  await page.goto('/home')
  await expect(page.getByRole('button', { name: 'Continue quest' })).toBeVisible()
}

/** Bounding box once the spring entrance has settled. */
async function settledBox(page: Page, title: string) {
  const card = toast(page, title)
  await expect(card).toBeVisible()
  await page.waitForTimeout(900)
  return (await card.boundingBox())!
}

async function startCurrentQuest(page: Page) {
  await page.getByRole('button', { name: 'Continue quest' }).click()
  await page.getByRole('dialog').getByRole('button', { name: /Start/ }).click()
}

test.describe('Toasts', () => {
  test('creating an account celebrates by first name, then leaves on its own', async ({ page }) => {
    await page.goto('/register')
    await fillRegister(page, makeUser({ display_name: 'Ligaya Magbanua' }))
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL(/\/home$/)
    const welcome = toast(page, 'Mabuhay, Ligaya!')
    await expect(welcome).toBeVisible()
    await expect(welcome).toContainText('Your first quest is waiting.')
    await expect(welcome).toHaveAttribute('data-tone', 'celebrate')
    await expect(welcome).toBeHidden({ timeout: 9_000 })
  })

  test('logging in welcomes the learner back, even across the redirect', async ({ page }) => {
    const user = await createAccount(page, makeUser({ display_name: 'Bayani Reyes' }))
    await page.goto('/login')
    await fillLogin(page, user.username, user.password)
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page).toHaveURL(/\/home$/)
    await expect(toast(page, 'Maligayang pagbabalik, Bayani!')).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Maligayang pagbabalik, Bayani!' })).toHaveCount(1)
  })

  test('failed login shows the inline error, not a toast', async ({ page }) => {
    await page.goto('/login')
    await fillLogin(page, makeUser().email, 'not the right password')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByRole('alert')).toContainText('incorrect')
    await expect(toasts(page)).toHaveCount(0)
  })

  test('logging out says goodbye on the login page and clears older toasts', async ({ page }) => {
    await openHome(page)
    await startCurrentQuest(page)
    await expect(toast(page, 'Lessons open soon')).toBeVisible()

    await page.getByRole('button', { name: /Account menu/ }).click()
    await page.getByRole('button', { name: 'Log out', exact: true }).click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(toast(page, "You're logged out")).toBeVisible()
    await expect(toasts(page)).toHaveCount(1)
  })

  test('logging out everywhere confirms it', async ({ page }) => {
    await openHome(page)
    await page.getByRole('button', { name: /Account menu/ }).click()
    await page.getByRole('button', { name: 'Log out on all devices' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(toast(page, 'Logged out on all devices')).toBeVisible()
  })

  test('logout that cannot reach the server warns but still signs out locally', async ({ page }) => {
    await openHome(page)
    await page.route('**/api/auth/logout', (route) => route.abort('internetdisconnected'))
    await page.getByRole('button', { name: /Account menu/ }).click()
    await page.getByRole('button', { name: 'Log out', exact: true }).click()

    await expect(page).toHaveURL(/\/login$/)
    const warning = toast(page, 'Logged out on this device')
    await expect(warning).toBeVisible()
    await expect(warning).toHaveAttribute('data-tone', 'warning')
    await expect(warning).toContainText('other sessions may still be active')
  })

  test('actions that are not live yet explain themselves', async ({ page }) => {
    await openHome(page)
    await startCurrentQuest(page)
    await expect(toast(page, 'Lessons open soon')).toContainText('Lolo at Lola becomes playable')

    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Guide' }).first().click()
    await expect(toast(page, 'The Pagbati guide is on its way')).toBeVisible()
  })

  test('repeated clicks show one toast, and the newest toast is on top', async ({ page }) => {
    await openHome(page)
    await page.getByRole('button', { name: 'Continue quest' }).click()
    const start = page.getByRole('dialog').getByRole('button', { name: /Start/ })
    for (let i = 0; i < 4; i++) await start.click()
    await expect(toast(page, 'Lessons open soon')).toHaveCount(1)

    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Guide' }).first().click()
    await expect(toasts(page).first()).toContainText('The Pagbati guide is on its way')
    await expect(toasts(page)).toHaveCount(2)
  })

  test('the close button and Escape dismiss a toast', async ({ page }) => {
    await openHome(page)
    await startCurrentQuest(page)
    const lessons = toast(page, 'Lessons open soon')
    await lessons.getByRole('button', { name: 'Dismiss notification' }).click()
    await expect(lessons).toBeHidden()

    await page.getByRole('button', { name: 'Guide' }).first().click()
    const guide = toast(page, 'The Pagbati guide is on its way')
    await guide.getByRole('button', { name: 'Dismiss notification' }).focus()
    await page.keyboard.press('Escape')
    await expect(guide).toBeHidden()
  })

  test('hovering pauses the timer so there is time to read', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Hover needs a pointer')
    await openHome(page)
    await startCurrentQuest(page)
    const lessons = toast(page, 'Lessons open soon')
    await lessons.hover()
    await page.waitForTimeout(6_000) // longer than the 4.5s info duration
    await expect(lessons).toBeVisible()

    await page.mouse.move(5, 895)
    await expect(lessons).toBeHidden({ timeout: 8_000 })
  })

  test('keyboard focus inside a toast pauses it too', async ({ page }) => {
    await openHome(page)
    await startCurrentQuest(page)
    const lessons = toast(page, 'Lessons open soon')
    await lessons.getByRole('button', { name: 'Dismiss notification' }).focus()
    await page.waitForTimeout(6_000)
    await expect(lessons).toBeVisible()
  })

  test('swiping a toast sideways dismisses it', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Mouse drag on desktop; touch uses the same drag handler')
    await openHome(page)
    await startCurrentQuest(page)
    const lessons = toast(page, 'Lessons open soon')
    const box = await settledBox(page, 'Lessons open soon')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 4 })
    await page.mouse.move(box.x + box.width / 2 + 220, box.y + box.height / 2, { steps: 4 })
    await page.mouse.up()
    await expect(lessons).toBeHidden()
  })

  test('a short drag snaps back instead of dismissing', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Mouse drag on desktop')
    await openHome(page)
    await startCurrentQuest(page)
    const lessons = toast(page, 'Lessons open soon')
    const box = await settledBox(page, 'Lessons open soon')
    await page.mouse.move(box.x + 40, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + 70, box.y + box.height / 2, { steps: 10 })
    await page.mouse.up()
    await expect(lessons).toBeVisible()
    await expect.poll(async () => Math.round((await lessons.boundingBox())!.x)).toBe(Math.round(box.x))
  })

  test('toasts stay usable with reduced motion and still wait before leaving', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openHome(page)
    await startCurrentQuest(page)
    const lessons = toast(page, 'Lessons open soon')
    await expect(lessons).toBeVisible()
    await page.waitForTimeout(2_000)
    await expect(lessons).toBeVisible()
    await expect(lessons).toBeHidden({ timeout: 6_000 })
  })

  test('toasts sit below the top bar and never cover the account menu', async ({ page }) => {
    await openHome(page)
    await startCurrentQuest(page)
    const topbar = (await page.locator('.topbar').boundingBox())!
    const card = await settledBox(page, 'Lessons open soon')
    expect(card.y).toBeGreaterThanOrEqual(topbar.y + topbar.height - 2)

    await page.getByRole('button', { name: /Account menu/ }).click()
    await expect(page.locator('.profile__panel')).toBeVisible()
  })

  test('long names wrap inside the toast without sideways scrolling', async ({ page }) => {
    await page.goto('/register')
    await fillRegister(page, makeUser({ display_name: 'Maximilianodelacruzsantosreyesbautistamagbanua' }))
    await page.getByRole('button', { name: 'Create account' }).click()
    const welcome = toast(page, /Mabuhay/)
    await expect(welcome).toBeVisible()
    const box = (await welcome.boundingBox())!
    const viewport = page.viewportSize()!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
    expect(await hasHorizontalOverflow(page)).toBe(false)
  })

  test('toasts pass axe WCAG 2.2 AA', async ({ page }) => {
    await openHome(page)
    await startCurrentQuest(page)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Guide' }).first().click()
    await expect(toasts(page)).toHaveCount(2)
    await page.waitForTimeout(700) // let the entrance settle before measuring contrast

    const results = await new AxeBuilder({ page })
      .include('.toaster')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })
})
