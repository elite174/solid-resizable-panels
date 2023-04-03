import withSolid from "rollup-preset-solid";
import copy from "rollup-plugin-copy";

export default withSolid([
  {
    input: "src/index.ts",
    targets: ["esm", "cjs"],
    plugins: [
      copy({
        targets: [{ src: "src/styles.css", dest: "dist" }],
      }),
    ],
  },
  {
    input: "src/server.ts",
    targets: ["esm", "cjs"],
    plugins: [
      copy({
        targets: [{ src: "src/styles.css", dest: "dist" }],
      }),
    ],
  },
]);
