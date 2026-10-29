import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// صفحتان: الرئيسية (index.html) ولوحة الأدمين (admin.html) بنفس الروابط القديمة
export default defineConfig({
  // إذا كان الرابط username.github.io/اسم-المستودع/ فأزل // من السطر التالي وضع اسم المستودع
    base: '/SpeSocial/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
});
