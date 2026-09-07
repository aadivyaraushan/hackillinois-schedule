import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  server: {
    proxy: {
      "/api/events": {
        target: "https://adonix.hackillinois.org",
        changeOrigin: true,
        rewrite: () => "/event/",
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.ui.test.jsx"],
    setupFiles: ["./src/test-setup.js"],
    globals: true,
  },
});
