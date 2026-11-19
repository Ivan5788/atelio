<template>
  <!-- 換頁時以 aria-live 讀出新頁面標題：SPA 換頁不會重新載入，螢幕閱讀器預設不會察覺 -->
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
