const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

esbuild.build({
  entryPoints: ["src/api/index.ts"],
  platform: "node",
  bundle: true,
  minify: true,
  packages: "external",
  target: "node20",
  outfile: "dist/index.js",
  logLevel: "info",
  treeShaking: true,
}).then(() => {

  console.log("esbuild complete");

  // Copy docs.html to dist folder
  fs.copyFileSync("src/api/routes/docs/docs.html", path.join("dist", "docs.html"));
  console.log("docs.html copied to dist folder");

  // Copy spec.json to dist folder
  fs.copyFileSync("src/api/routes/docs/spec.json", path.join("dist", "spec.json"));
  console.log("spec.json copied to dist folder");

  console.log("Build complete");
}).catch((e) => {
  console.error("Build failed");
  console.error(e);
  process.exit(1);
});
