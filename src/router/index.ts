import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'calendar',
      component: () => import('@/views/CalendarView.vue'),
      meta: {
        title: '月历建议',
        acceptsQuery: {
          plantName: {
            type: 'string',
            description: '植物名称，用于跳转后自动选中同名植物（仅精确匹配），处理完成后自动清除',
          },
        },
      },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: '植物总览看板' },
    },
    {
      path: '/my-plants',
      name: 'my-plants',
      component: () => import('@/views/MyPlantsView.vue'),
      meta: { title: '我的植物' },
    },
    {
      path: '/care-records',
      name: 'care-records',
      component: () => import('@/views/CareRecordsView.vue'),
      meta: { title: '养护记录' },
    },
    {
      path: '/care-stats',
      name: 'care-stats',
      component: () => import('@/views/CareStatsView.vue'),
      meta: { title: '养护数据统计' },
    },
    {
      path: '/weekly-care-tips',
      name: 'weekly-care-tips',
      component: () => import('@/views/WeeklyCareTipsView.vue'),
      meta: { title: '本周养护提示' },
    },
    {
      path: '/city-compare',
      name: 'city-compare',
      component: () => import('@/views/CityCompareView.vue'),
      meta: { title: '双城对比' },
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'),
      meta: { title: '我的收藏' },
    },
    {
      path: '/encyclopedia',
      name: 'encyclopedia',
      component: () => import('@/views/EncyclopediaView.vue'),
      meta: { title: '植物百科' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { title: '设置' },
    },
  ],
});

router.afterEach((to) => {
  const title = (to.meta.title as string) ?? '城市阳台种植月历';
  document.title = `${title} · 城市阳台种植月历`;
});

export default router;
