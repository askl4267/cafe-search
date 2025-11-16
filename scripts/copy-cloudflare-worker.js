import {
  copyFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  cpSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
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
const destinationWorker = join(destinationOpenNext, "worker.js");
copyFileSync(workerSource, destinationWorker);

patchOpenNextFiles(destinationOpenNext);

function patchOpenNextFiles(baseDir) {
  const replacements = [
    ["async await(", "async awaitAll("],
    ["pendingPromiseRunner.await(", "pendingPromiseRunner.awaitAll("],
  ];
  const filesToPatch = [
    join("middleware", "handler.mjs"),
    join("server-functions", "default", "index.mjs"),
    join("server-functions", "default", "handler.mjs"),
  ];
  for (const relativePath of filesToPatch) {
    const filePath = join(baseDir, relativePath);
    if (!existsSync(filePath)) {
      continue;
    }
    let content = readFileSync(filePath, "utf8");
    let next = content;
    for (const [search, replacement] of replacements) {
      next = next.split(search).join(replacement);
    }
    if (next !== content) {
      writeFileSync(filePath, next, "utf8");
    }
  }
}
