const { generateTspec } = require("tspec");
const fs = require("fs");
const path = require("path");

const options = {
  specPathGlobs: ["./src/**/tspec.ts"],
  tsconfigPath: "./tsconfig.json",
  outputPath: "./src/api/routes/docs/spec.json",
  specVersion: 3,
  debug: false,
  ignoreErrors: true,
  openapi: {
    title: "Nance API",
    version: "1.0.0",
    description: "API service for Nance. Governance Automated.",
    servers: [
      { url: "https://api.nance.app", description: "production" },
      { url: "http://localhost:3003", description: "local" }
    ],
    securityDefinitions: {
      jwt: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "jwt",
      },
    }
  }
};

async function generate() {
  const openApiSpec = await generateTspec(options);
  console.log(openApiSpec)
  // Copy docs.html to dist folder
  fs.copyFileSync("src/api/routes/docs/docs.html", path.join("dist", "docs.html"));
  console.log("docs.html copied to dist folder");

  // Copy spec.json to dist folder
  fs.copyFileSync("src/api/routes/docs/spec.json", path.join("dist", "spec.json"));
  console.log("spec.json copied to dist folder");
  console.log("Done.")
}

generate();
