import { expect, makeUser, registerViaApi, test } from '../support/fixtures'

test.describe('Session lifecycle', () => {
  test('signed-in learners skip the auth pages', async ({ page }) => {
    await registerViaApi(page)
    for (const path of ['/login', '/register', '/', '/some/unknown/page']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/home$/)
    }
  })

  test('session survives a reload', async ({ page }) => {
    await registerViaApi(page)
    await page.goto('/home')
    await page.reload()
    await expect(page.getByRole('button', { name: 'Continue quest' })).toBeVisible()
  })

  test('log out returns to login and the back button cannot reopen home', async ({ page }) => {
    await registerViaApi(page)
    await page.goto('/home')
    await page.getByRole('button', { name: /Account menu/ }).click()
    await page.getByRole('button', { name: 'Log out', exact: true }).click()
    await expect(page).toHaveURL(/\/login$/)

    await page.goBack()
    await expect(page).not.toHaveURL(/\/home/)
    await expect(page.getByRole('button', { name: 'Continue quest' })).toHaveCount(0)
    await page.goto('/home')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('log out on all devices signs out other browsers too', async ({ page, browser }) => {
    const user = makeUser()
    await registerViaApi(page, user)

    const laptop = await browser.newContext()
    const laptopPage = await laptop.newPage()
    await laptopPage.goto('/login')
    await laptopPage.getByLabel('Email or username').fill(user.username)
    await laptopPage.getByLabel('Password', { exact: true }).fill(user.password)
    await laptopPage.getByRole('button', { name: 'Log in' }).click()
    await expect(laptopPage).toHaveURL(/\/home$/)

    await page.goto('/home')
    await page.getByRole('button', { name: /Account menu/ }).click()
    await page.getByRole('button', { name: 'Log out on all devices' }).click()
    await expect(page).toHaveURL(/\/login$/)

    await laptopPage.reload()
    await expect(laptopPage).toHaveURL(/\/login$/)
    await laptop.close()
  })

  test('a forged session cookie is treated as signed out', async ({ page, baseURL }) => {
    await page.context().addCookies([{ name: 'kawika_session', value: 'forged-token', url: baseURL! }])
    await page.goto('/home')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('a missing CSRF cookie is recovered transparently', async ({ page }) => {
    const user = makeUser()
    await registerViaApi(page, user)
    await page.context().clearCookies()
    await page.goto('/login')
    await page.context().clearCookies()

    await page.getByLabel('Email or username').fill(user.username)
    await page.getByLabel('Password', { exact: true }).fill(user.password)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/home$/)
  })
})
