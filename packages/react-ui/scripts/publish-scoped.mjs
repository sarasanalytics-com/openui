#!/usr/bin/env node
// Publishes this package under the scoped name @sarasanalytics-com/openui-react-ui
// without permanently altering package.json. The manifest is rewritten in place,
// published, then restored — even if publishing fails.
//
// Usage: node scripts/publish-scoped.mjs <version> [--dry-run]

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SCOPED_NAME = "@sarasanalytics-com/openui-react-ui";
const PUBLISHED_PEER_DEPS = {
  "@openuidev/react-headless": "^0.8.2",
  "@openuidev/react-lang": "^0.2.6",
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, "..", "package.json");

const version = process.argv[2];
const dryRun = process.argv.includes("--dry-run");

if (!version || version.startsWith("--")) {
  console.error("Usage: node scripts/publish-scoped.mjs <version> [--dry-run]");
  process.exit(1);
}

const original = readFileSync(pkgPath, "utf8");
const pkg = JSON.parse(original);

pkg.name = SCOPED_NAME;
pkg.version = version;
pkg.publishConfig = { ...(pkg.publishConfig ?? {}), access: "public" };

pkg.peerDependencies = { ...pkg.peerDependencies };
for (const [dep, range] of Object.entries(PUBLISHED_PEER_DEPS)) {
  if (dep in pkg.peerDependencies) {
    pkg.peerDependencies[dep] = range;
  }
}

try {
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  // pnpm, not npm: the manifest keeps `catalog:` ranges (react, zustand, …)
  // that only pnpm resolves to real semver at pack time — npm would publish
  // them verbatim and break every consumer. --no-git-checks because this
  // script itself dirties package.json for the duration of the publish.
  const args = ["publish", "--no-git-checks"];
  if (dryRun) {
    args.push("--dry-run");
  }
  // Forward auth/extra flags (e.g. --otp=123456) to pnpm publish.
  for (const arg of process.argv.slice(3)) {
    if (arg.startsWith("--") && arg !== "--dry-run") {
      args.push(arg);
    }
  }
  console.log(`Publishing ${SCOPED_NAME}@${version}${dryRun ? " (dry run)" : ""}...`);
  execFileSync("pnpm", args, { cwd: join(__dirname, ".."), stdio: "inherit" });
} finally {
  writeFileSync(pkgPath, original);
  console.log("Restored original package.json");
}
