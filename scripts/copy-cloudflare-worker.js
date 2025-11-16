import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const source = join(projectRoot, ".open-next", "worker.js");
const sourceDir = join(projectRoot, ".open-next");
const destinationDir = join(projectRoot, "functions");
const destinationWorker = join(destinationDir, "worker.bundle.js");
const destinationOpenNext = join(destinationDir, ".open-next");

if (!existsSync(source)) {
  throw new Error(`OpenNext worker bundle not found at ${source}`);
}

rmSync(destinationOpenNext, { recursive: true, force: true });
mkdirSync(destinationDir, { recursive: true });
cpSync(sourceDir, destinationOpenNext, { recursive: true });
cpSync(source, destinationWorker);
