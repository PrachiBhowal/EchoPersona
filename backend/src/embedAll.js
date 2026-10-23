import fs from "node:fs";
import { embedTexts } from "./embed.js";

const IN = new URL("../../data/cleaned-emails.json", import.meta.url);
const OUT = new URL("../../data/embeddings.json", import.meta.url);

const emails = JSON.parse(fs.readFileSync(IN, "utf8"));
const texts = emails.map((e) => `${e.subject}\n\n${e.text}`);

const BATCH = 16;
const vectors = [];
for (let i = 0; i < texts.length; i += BATCH) {
    vectors.push(...(await embedTexts(texts.slice(i, i + BATCH))));
    console.log(`  embedded ${Math.min(i + BATCH, texts.length)}/${texts.length}`);
}

const records = emails.map((e, i) => ({
    id: e.id,
    origin: e.origin,
    to: e.to,
    subject: e.subject,
    text: e.text,
    internalDate: e.internalDate,
    vector: vectors[i],
}));

fs.writeFileSync(OUT, JSON.stringify(records));
console.log(`Saved ${records.length} embeddings to data/embeddings.json`);