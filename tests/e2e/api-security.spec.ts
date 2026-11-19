import { expect, test, type APIRequestContext } from '@playwright/test'

/**
 * API 安全控制的實測（docs/05-security.md §6）。
 * 直接打 API，模擬「繞過前端」的請求：前端驗證可以被跳過，這些檢查必須在伺服器成立。
 * 只需要跑一種裝置。
 */
test.skip(
  ({ browserName, isMobile }) => isMobile || browserName !== 'chromium',
  'API 測試只需執行一次',
)

const BASE = 'http://localhost:3100'
const ORIGIN = { Origin: BASE }

async function demoUser(request: APIRequestContext) {
  const res = await request.post('/api/auth/demo', { headers: ORIGIN })
  expect(res.ok()).toBe(true)
}

async function openSession(request: APIRequestContext) {
  const res = await request.get('/api/workshops/wheel-throwing-basics-taipei/sessions')
  const sessions = (await res.json()) as { id: string; startsAt: string; seatsLeft: number }[]
  return sessions.find(
    (s) => s.seatsLeft >= 1 && Date.parse(s.startsAt) - Date.now() > 80 * 3_600_000,
  )!
}

test('C-11: state-changing requests without a same-site Origin are rejected', async ({
  request,
}) => {
  expect((await request.post('/api/auth/demo')).status()).toBe(403)
  expect(
    (
      await request.post('/api/auth/demo', { headers: { Origin: 'https://evil.example' } })
    ).status(),
  ).toBe(403)
})

test('C-11: non-JSON bodies are rejected', async ({ request }) => {
  await demoUser(request)
  const res = await request.post('/api/me/bookings', {
    headers: { ...ORIGIN, 'Content-Type': 'application/x-www-form-urlencoded' },
    data: 'quantity=1',
  })
  expect(res.status()).toBe(415)
})

test('C-02: invalid input returns 400 with field errors', async ({ request }) => {
  const list = await request.get('/api/workshops?pageSize=500&category=hacking')
  expect(list.status()).toBe(400)
  const body = await list.json()
  expect(Object.keys(body.data.fieldErrors)).toEqual(
    expect.arrayContaining(['pageSize', 'category.0']),
  )
})

test('C-01: protected endpoints require login', async ({ request }) => {
  expect((await request.get('/api/me')).status()).toBe(401)
  expect((await request.get('/api/studio/workshops')).status()).toBe(401)
})

test('T: price sent by the client is ignored; total is computed on the server', async ({
  request,
}) => {
  await demoUser(request)
  const session = await openSession(request)
  const res = await request.post('/api/me/bookings', {
    headers: ORIGIN,
    data: {
      workshopSlug: 'wheel-throwing-basics-taipei',
      sessionId: session.id,
      quantity: 1,
      contact: { name: '測試', phone: '0912345678' },
      unitPrice: 1,
      total: 1,
    },
  })
  expect(res.status()).toBe(201)
  const booking = await res.json()
  expect(booking.unitPrice).toBe(1800)
  expect(booking.total).toBe(1800)
})

test('C-03: another user cannot read, change or cancel my booking (IDOR)', async ({
  playwright,
}) => {
  const alice = await playwright.request.newContext({ baseURL: BASE })
  const bob = await playwright.request.newContext({ baseURL: BASE })
  await demoUser(alice)
  await demoUser(bob)

  const [aliceBooking] = (await (await alice.get('/api/me/bookings')).json()) as { id: string }[]
  expect(aliceBooking).toBeTruthy()

  expect((await bob.get(`/api/me/bookings/${aliceBooking!.id}`)).status()).toBe(404)
  expect(
    (
      await bob.patch(`/api/me/bookings/${aliceBooking!.id}`, {
        headers: ORIGIN,
        data: { quantity: 1 },
      })
    ).status(),
  ).toBe(404)
  expect(
    (await bob.delete(`/api/me/bookings/${aliceBooking!.id}`, { headers: ORIGIN })).status(),
  ).toBe(404)
  // Alice 的預約仍然存在
  expect((await alice.get(`/api/me/bookings/${aliceBooking!.id}`)).status()).toBe(200)

  await alice.dispose()
  await bob.dispose()
})

test('C-14: login failure does not reveal whether the email exists', async ({ request }) => {
  const email = `sec-${Date.now()}@example.com`
  await request.post('/api/auth/register', {
    headers: ORIGIN,
    data: { name: 'T', email, password: 'atelio2026', confirmPassword: 'atelio2026' },
  })
  const wrongPassword = await request.post('/api/auth/login', {
    headers: ORIGIN,
    data: { email, password: 'wrong-pass-1' },
  })
  const unknownEmail = await request.post('/api/auth/login', {
    headers: ORIGIN,
    data: { email: `nobody-${Date.now()}@example.com`, password: 'wrong-pass-1' },
  })
  expect(wrongPassword.status()).toBe(401)
  expect(unknownEmail.status()).toBe(401)
  expect((await wrongPassword.json()).message).toBe((await unknownEmail.json()).message)
})

test('C-01: session cookie is httpOnly, Secure and SameSite=Lax', async ({ request }) => {
  const res = await request.post('/api/auth/demo', { headers: ORIGIN })
  const cookie = res.headers()['set-cookie'] ?? ''
  expect(cookie).toMatch(/HttpOnly/i)
  expect(cookie).toMatch(/Secure/i)
  expect(cookie).toMatch(/SameSite=Lax/i)
})
