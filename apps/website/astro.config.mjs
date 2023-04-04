import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [solid({ ssr: true }), tailwind()],
});
