const esbuild = require("esbuild");
const { spawn } = require("child_process");

let nodeProcess = null;
let ctx = null;

function padText(text, length = 50) {
  const paddingSize = Math.max(length - text.length, 0);
  const padding = '='.repeat(paddingSize / 2);
  return `${padding} ${text} ${padding}`;
}

function startNodeProcess() {
  if (nodeProcess) {
    nodeProcess.kill();
  }

  nodeProcess = spawn("node", ["dist/api/index.js"], { stdio: "inherit" });

  nodeProcess.on("close", (code) => {
    if (code !== null) {
      console.log(`🛑 ${padText(`Node process exited with code ${code}`, 50)} 🛑`);
    }
  });
}

async function watch() {
  ctx = await esbuild.context({
    entryPoints: ["./src/api/index.ts"],
    platform: "node",
    minify: false,
    outfile: "./dist/api/index.js",
    packages: "external",
    external: ["./transpilers/swc.js"],
    bundle: true,
    loader: { ".ts": "ts" },
    plugins: [
      {
        name: "restart-node-on-build",
        setup(build) {
          build.onEnd(() => {
            console.log("=".repeat(57));
            console.log(`✅ ${padText("Build succeeded, restarting", 50)} ✅`);
            console.log(`👀 ${padText("Watching for changes...", 50)} 👀`);
            console.log("=".repeat(57),"\n");
            startNodeProcess();
          });
        }
      }
    ]
  });

  await ctx.watch();
}

watch();

// Handle termination signals
process.on("SIGINT", () => {
  console.log();
  console.log("=".repeat(58));
  console.log(`⚠️  ${padText("Caught interrupt signal. Shutting down", 50)} ⚠️`);
  console.log("=".repeat(58));
  if (nodeProcess) {
    nodeProcess.kill();
  }
  if (ctx) {
    ctx.dispose();
  }
  process.exit();
});
