/**
 * 登入狀態與動作。包裝 nuxt-auth-utils 的 useUserSession，
 * 並在登入／登出時同步收藏等需要登入的資料。
 *
 * 注意：前端的登入判斷只影響畫面（顯示哪些按鈕、要不要導向登入頁），
 * 真正的權限檢查在伺服器（server/utils/auth.ts）。
 */
import { accountService } from '~/services/account.service'
import { useFavoritesStore } from '~/stores/favorites'
import { useToastStore } from '~/stores/toast'
import type { LoginInput, RegisterInput } from '#shared/schemas'

export function useAuth() {
  const session = useUserSession()
  const favorites = useFavoritesStore()
  const loginPromptOpen = useState('login-prompt-open', () => false)

  async function afterLogin() {
    await session.fetch()
    await favorites.load()
  }

  async function demoLogin() {
    await accountService.demoLogin()
    await afterLogin()
  }

  async function login(input: LoginInput) {
    await accountService.login(input)
    await afterLogin()
  }

  async function register(input: RegisterInput) {
    await accountService.register(input)
    await afterLogin()
  }

  async function logout() {
    await accountService.logout().catch(() => undefined)
    await session.clear().catch(() => undefined)
    favorites.reset()
    useToastStore().info('已登出')
    await navigateTo('/')
  }

  /** 需要登入的操作（例如收藏）：已登入就執行，未登入則開啟登入提示 */
  function requireLogin(action: () => unknown) {
    if (session.loggedIn.value) return action()
    loginPromptOpen.value = true
  }

  return {
    ready: session.ready,
    loggedIn: session.loggedIn,
    user: session.user,
    loginPromptOpen,
    demoLogin,
    login,
    register,
    logout,
    requireLogin,
    refresh: session.fetch,
  }
}
