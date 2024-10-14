const esbuild = require("esbuild");

esbuild.build({
  entryPoints: ["src/api/index.ts"],
  platform: "node",
  bundle: true,
  minify: true,
  packages: "external",
  target: "node20",
  outfile: "dist/api/index.js",
  logLevel: "info",
}).then(() => {
  console.log("Build complete");
}).catch(() => {
  console.error("Build failed");
  process.exit(1);
});
