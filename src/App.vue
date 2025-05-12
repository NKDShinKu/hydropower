<script setup>
import { defineAsyncComponent } from 'vue';
import LoadingSpinner from './components/LoadingSpinner.vue';

// 异步加载导航组件
const NavBar = defineAsyncComponent({
  loader: () => import('./components/NavBar.vue'),
  loadingComponent: LoadingSpinner,
  delay: 200,
  timeout: 3000
});
</script>

<template>
  <div class="app-container">
    <NavBar />
    <div class="content-container">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <Suspense>
            <component :is="Component" :key="$route.fullPath" />
            <template #fallback>
              <LoadingSpinner />
            </template>
          </Suspense>
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Microsoft YaHei', sans-serif;
}

body {
  background-color: #f5f7fa;
  color: #333;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

.content-container {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .content-container {
    padding: 1rem;
  }
}
</style>
