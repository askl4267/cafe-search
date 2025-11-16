import { copyFileSync, existsSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const workerSource = join(projectRoot, ".open-next", "worker.js");
const directoriesToCopy = [
  "cloudflare",
  "cloudflare-templates",
  "middleware",
  "server-functions",
  ".build",
  "dynamodb-provider",
];
const destinationDir = join(projectRoot, "functions");
const destinationOpenNext = join(destinationDir, ".open-next");
const destinationWorker = join(destinationDir, "worker.bundle.js");

if (!existsSync(workerSource)) {
  throw new Error(`OpenNext worker bundle not found at ${workerSource}`);
}

rmSync(destinationOpenNext, { recursive: true, force: true });
mkdirSync(destinationDir, { recursive: true });
for (const subdir of directoriesToCopy) {
  const src = join(projectRoot, ".open-next", subdir);
  const dst = join(destinationOpenNext, subdir);
  if (existsSync(src)) {
    mkdirSync(dst, { recursive: true });
    cpSync(src, dst, { recursive: true });
  }
}
copyFileSync(workerSource, destinationWorker);
