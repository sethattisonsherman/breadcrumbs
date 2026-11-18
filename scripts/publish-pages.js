import {
  mkdir,
  copyFile,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
await mkdir(new URL("assets/", root), { recursive: true });
// Keep older hashed assets available for visitors with a cached HTML document.
for (const file of await readdir(new URL("dist/assets/", root))) {
  await copyFile(
    new URL("dist/assets/" + file, root),
    new URL("assets/" + file, root),
  );
}
await writeFile(
  new URL("index.html", root),
  (await readFile(new URL("dist/index.html", root), "utf8")).replace(
    /\r\n?/g,
    "\n",
  ),
);
console.log(
  "Prepared compiled index.html and assets/ for branch-based GitHub Pages.",
);
