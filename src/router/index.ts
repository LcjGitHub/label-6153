import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'calendar',
      component: () => import('@/views/CalendarView.vue'),
      meta: { title: '月历建议' },
    },
    {
      path: '/my-plants',
      name: 'my-plants',
      component: () => import('@/views/MyPlantsView.vue'),
      meta: { title: '我的植物' },
    },
  ],
});

router.afterEach((to) => {
  const title = (to.meta.title as string) ?? '城市阳台种植月历';
  document.title = `${title} · 城市阳台种植月历`;
});

export default router;
