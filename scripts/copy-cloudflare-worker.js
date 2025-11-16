import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const projectRoot = process.cwd();
const source = join(projectRoot, ".open-next", "worker.js");
const destinationDir = join(projectRoot, "functions");
const destination = join(destinationDir, "worker.bundle.js");

if (!existsSync(source)) {
  throw new Error(`OpenNext worker bundle not found at ${source}`);
}

mkdirSync(destinationDir, { recursive: true });
copyFileSync(source, destination);
