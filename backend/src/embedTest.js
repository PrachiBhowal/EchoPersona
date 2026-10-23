import fs from "node:fs";
import { embedTexts, cosine } from "./embed.js";

const emails = JSON.parse(
    fs.readFileSync(new URL("../../data/cleaned-emails.json", import.meta.url), "utf8")
).slice(0, 5);

const texts = emails.map((e) => `${e.subject}\n\n${e.text}`);

console.time("embed");
const vectors = await embedTexts(texts);
console.timeEnd("embed");

console.log("Vectors:", vectors.length, "| dimensions:", vectors[0].length);
console.log("\nSimilarity between the first 5 emails (1.00 = identical):");
console.table(vectors.map((a) => vectors.map((b) => Number(cosine(a, b).toFixed(2)))));
console.log(emails.map((e, i) => `${i}: ${e.subject}`).join("\n"));