import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: './tool/',
  plugins: [vue()],
  publicDir: 'public', // 指定静态资源目录
})
