import * as tspec from "tspec";

export const options = {
  specPathGlobs: ["./scripts/*.ts"],
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
  const openApiSpec = await tspec.generateTspec(options);
  console.log(openApiSpec)
}

generate();
