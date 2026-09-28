import { defineConfig } from 'vite';

// Relative base so the built assets resolve under a GitHub Project Pages
// subpath (https://<user>.github.io/<repo>/) as well as at the domain root.
export default defineConfig({
  base: './',
});
