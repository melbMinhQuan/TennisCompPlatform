// Checks the live site straight after a deploy, so a release that breaks it turns the run red.
//   BACKEND_URL=https://... FRONTEND_URL=https://... node .github/scripts/smoke-test.mjs backend|frontend
// Keeps trying for up to 5 minutes: after an upload App Service restarts the backend and runs
// migrations first, and the Free F1 plan can take minutes to wake. GIVE_UP_AFTER_SECONDS shortens
// that for a server that should already be up, such as CI's own copy of the backend package.
const GIVE_UP_AFTER_MS = Number(process.env.GIVE_UP_AFTER_SECONDS || 300) * 1000
const WAIT_MS = 15_000
const TIMEOUT_MS = 30_000
const { BACKEND_URL, FRONTEND_URL } = process.env

const checks = {
  // An unknown email answering "login_failed" (rather than 500) proves the API is up and can read
  // the database. The CORS header proves the live frontend is allowed to call it.
  async backend() {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: FRONTEND_URL },
      body: JSON.stringify({ email: 'smoke-test@ci.invalid', password: 'smoke-test' }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (response.status !== 200) throw new Error(`POST /auth/login answered ${response.status}`)
    const { result } = await response.json()
    if (result !== 'login_failed') throw new Error(`POST /auth/login answered "${result}"`)
    const allowedOrigin = response.headers.get('access-control-allow-origin')
    if (allowedOrigin !== FRONTEND_URL) {
      throw new Error(`CORS allows ${allowedOrigin}, not ${FRONTEND_URL}: check CORS_ORIGIN in Azure`)
    }

    // The club admin routes are deployed and check who is asking: an unknown email is refused
    // with 401 (a 404 would mean the routes are missing, a 403 DEMO_DISABLED that NODE_ENV is
    // production). Then the browser's preflight for the PUT, PATCH and DELETE requests that only
    // the club admin pages send: without them allowed, every change fails while every page loads.
    const clubAdmin = await fetch(`${BACKEND_URL}/api/v1/club-admin/dashboard?email=smoke-test%40ci.invalid`, {
      headers: { Origin: FRONTEND_URL },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (clubAdmin.status !== 401) {
      const { code } = await clubAdmin.json().catch(() => ({}))
      throw new Error(`GET /api/v1/club-admin/dashboard answered ${clubAdmin.status}${code ? ` ${code}` : ''}, not 401`)
    }
    for (const method of ['PUT', 'PATCH', 'DELETE']) {
      const preflight = await fetch(`${BACKEND_URL}/api/v1/club-admin/teams/smoke-test/manager`, {
        method: 'OPTIONS',
        headers: { Origin: FRONTEND_URL, 'Access-Control-Request-Method': method, 'Access-Control-Request-Headers': 'content-type' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      const allowed = (preflight.headers.get('access-control-allow-methods') ?? '').split(',').map(name => name.trim())
      if (!preflight.ok || !allowed.includes(method) || preflight.headers.get('access-control-allow-origin') !== FRONTEND_URL) {
        throw new Error(`CORS does not let ${FRONTEND_URL} send ${method} (allowed: ${allowed.join(', ') || 'none'})`)
      }
    }
  },

  // The home page, and a deep link that only loads through staticwebapp.config.json.
  async frontend() {
    for (const route of ['/', '/dashboard']) {
      const response = await fetch(FRONTEND_URL + route, { signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (response.status !== 200) throw new Error(`GET ${route} answered ${response.status}`)
      if (!(await response.text()).includes('<div id="root">')) throw new Error(`GET ${route} is not the React app`)
    }
  },
}

const target = process.argv[2]
if (!checks[target] || !BACKEND_URL || !FRONTEND_URL) {
  console.error('Usage: BACKEND_URL=https://... FRONTEND_URL=https://... node .github/scripts/smoke-test.mjs backend|frontend')
  process.exit(2)
}

const giveUpAt = Date.now() + GIVE_UP_AFTER_MS
for (let attempt = 1; ; attempt++) {
  try {
    await checks[target]()
    console.log(`The ${target} is working.`)
    process.exit(0)
  } catch (error) {
    // fetch reports network failures as "fetch failed" with the real reason in error.cause.
    const reason = error.cause?.code || error.cause?.message
    console.log(`Attempt ${attempt}: ${error.message}${reason ? ` (${reason})` : ''}`)
    if (Date.now() + WAIT_MS > giveUpAt) break
    await new Promise(resolve => setTimeout(resolve, WAIT_MS))
  }
}
console.error(`The ${target} was still failing after ${GIVE_UP_AFTER_MS / 1000} seconds.`)
process.exit(1)
