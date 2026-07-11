import { defineConfig } from 'astro/config';

// GitHub Pages project page: https://<user>.github.io/<repo>/
export default defineConfig({
  site: 'https://yurichayamachi.github.io',
  base: '/samapoke_map',
  outDir: './dist',
  build: {
    assets: 'astro-assets',
  },
});
