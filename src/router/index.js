import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Overview",
    component: () => import("../views/Overview.vue"),
    // 添加路由级别缓存
    meta: {
      keepAlive: true,
    },
  },
  {
    path: "/details",
    name: "Details",
    component: () => import("../views/Details.vue"),
    // 添加路由级别缓存
    meta: {
      keepAlive: true,
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  // 滚动行为
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// 添加全局导航守卫进行性能监控
router.beforeEach((to, from, next) => {
  const startTime = performance.now();
  next();
  window.addEventListener("load", () => {
    const duration = performance.now() - startTime;
    console.log(`Route ${to.path} loaded in ${duration}ms`);
  });
});

export default router;
