import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const copies = [
  [".next/static", ".next/standalone/.next/static"],
  ["public", ".next/standalone/public"],
];

for (const [source, destination] of copies) {
  if (!existsSync(source)) {
    continue;
  }

  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });
}

