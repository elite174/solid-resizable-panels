import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import dts from "vite-plugin-dts";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    dts({
      entryRoot: "src/lib",
      rollupTypes: true,
    }),
    solid(),
    viteStaticCopy({
      targets: [
        {
          src: "src/lib/styles.css",
          dest: "",
        },
      ],
    }),
  ],
  build: {
    lib: {
      entry: "src/lib/index.ts",
      fileName: "index",
      formats: ["es"],
    },
    emptyOutDir: true,
    outDir: "dist",
    minify: false,
    rollupOptions: {
      external: ["solid-js", "solid-js/web", "solid-js/store"],
    },
  },
});
