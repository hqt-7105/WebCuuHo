import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/map',
      name: 'map',
      // lazy-load: CSS và JS của trang bản đồ (Leaflet...) chỉ tải khi người dùng thật sự vào /map,
      // không cộng dồn vào bundle của trang chủ.
      component: () => import('@/views/MapView.vue')
    }
  ]
})

export default router
