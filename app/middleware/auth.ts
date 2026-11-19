/**
 * 路由守衛：會員中心、預約、Studio 需要登入（docs/05-security.md C-04）。
 * 這只是使用者體驗：讓未登入的人直接看到登入頁，而不是一個會出錯的空白頁。
 * 就算繞過這裡，伺服器 API 仍會回 401，資料不會外洩。
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, ready, fetch } = useUserSession()
  // 這些頁面只在瀏覽器渲染；第一次進站時 Session 可能還沒讀取完成
  if (!ready.value) await fetch()
  if (!loggedIn.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
