import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [vue()],
  build: {
    // 启用构建缓存
    cache: true,
    // 代码分割配置
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: ["echarts"],
          vendor: ["vue", "vue-router"],
        },
      },
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 设置块大小警告限制
    chunkSizeWarningLimit: 1000,
    // 压缩配置
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
