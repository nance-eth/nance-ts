const esbuild = require("esbuild");
const { rm } = require("fs/promises");

// Clean up dist directory first
rm("dist", { recursive: true, force: true }).then(() => {
  console.log("removed dist/");
  // Start the build after cleanup
  return esbuild.build({
    entryPoints: ["src/api/index.ts"],
    platform: "node",
    bundle: true,
    minify: true,
    packages: "external",
    target: "node20",
    outfile: "dist/index.js",
    logLevel: "info",
    treeShaking: true,
  });
})
.then(() => {
  console.log("esbuild complete");
  console.log("Build complete");
})
.catch((e) => {
  console.error("Build failed");
  console.error(e);
  process.exit(1);
});
