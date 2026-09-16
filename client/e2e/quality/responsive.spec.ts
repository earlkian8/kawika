import { expect, hasHorizontalOverflow, makeUser, registerViaApi, test } from '../support/fixtures'

const WIDTHS = [320, 375, 414, 768, 1024, 1280, 1920]

test.describe('Responsive layout', () => {
  test.skip(({ isMobile }) => isMobile, 'Viewport sweep runs once on the desktop project')

  for (const width of WIDTHS) {
    test(`no sideways scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })

      await page.goto('/login')
      await expect(page.getByRole('heading', { name: 'Tara, magpatuloy.' })).toBeVisible()
      expect(await hasHorizontalOverflow(page), 'login').toBe(false)

      await page.goto('/register')
      await page.getByRole('button', { name: 'Create account' }).click()
      await expect(page.getByText('Enter a valid email address.')).toBeVisible()
      expect(await hasHorizontalOverflow(page), 'register with errors').toBe(false)

      await registerViaApi(page, makeUser({ display_name: 'Maximilianodelacruzsantosreyes Bautista' }))
      await page.goto('/home')
      await expect(page.getByRole('button', { name: 'Continue quest' })).toBeVisible()
      await page.getByRole('button', { name: 'Continue quest' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      expect(await hasHorizontalOverflow(page), 'home with quest open').toBe(false)
      for (const item of await page.locator('.nav__item').all()) {
        const itemBox = (await item.boundingBox())!
        expect(itemBox.x, 'nav item inside viewport').toBeGreaterThanOrEqual(0)
        expect(itemBox.x + itemBox.width, 'nav item inside viewport').toBeLessThanOrEqual(width)
      }
      await expect(page.getByRole('link', { name: /Lakbay/ })).toBeVisible()

      await page.getByRole('button', { name: /Account menu/ }).click()
      const panel = page.locator('.profile__panel')
      await expect(panel).toBeVisible()
      const box = (await panel.boundingBox())!
      expect(box.x, 'account menu inside viewport').toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width)
    })
  }

  test('mobile nav sits at the bottom and never covers the last content', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await registerViaApi(page)
    await page.goto('/home')
    const nav = page.getByRole('navigation', { name: 'Main' })
    const navBox = (await nav.boundingBox())!
    expect(navBox.y + navBox.height).toBeGreaterThanOrEqual(843)

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const league = page.getByRole('heading', { name: 'Perlas League' })
    await expect(league).toBeVisible()
    const lastRow = (await page.locator('.league__row').last().boundingBox())!
    expect(lastRow.y + lastRow.height).toBeLessThanOrEqual(navBox.y)
  })
})
