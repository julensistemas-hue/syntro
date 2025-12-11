import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  site: "https://aisecurity.es",
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/login') &&
        !page.includes('/signup') &&
        !page.includes('/akiwifi_old'),
      customPages: [
        'https://aisecurity.es/',
        'https://aisecurity.es/wazuh',
        'https://aisecurity.es/curso-wazuh',
        'https://aisecurity.es/blog',
        'https://aisecurity.es/blog/ia-threat-hunting-wazuh',
        'https://aisecurity.es/reunion',
      ],
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    })
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
