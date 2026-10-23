import { retrieve } from "./retrieve.js";

// Usage: npm run search -- "partial text" [--to someone@domain.com]
const args = process.argv.slice(2);
const toIdx = args.indexOf("--to");
const recipient = toIdx >= 0 ? args[toIdx + 1] : undefined;
const query = args
    .filter((_, i) => toIdx < 0 || (i !== toIdx && i !== toIdx + 1))
    .join(" ")
    .trim();

if (!query) {
    console.log('Usage: npm run search -- "partial text" [--to someone@domain.com]');
    process.exit(1);
}

const results = await retrieve(query, { recipient, k: 5 });

console.log(`Query: "${query}"${recipient ? `  (recipient: ${recipient})` : ""}\n`);
for (const r of results) {
    const boost = r.boost ? ` + boost ${r.boost.toFixed(2)}` : "";
    console.log(`${r.score.toFixed(2)} (sim ${r.similarity.toFixed(2)}${boost}) | ${r.origin} | ${r.subject}`);
    console.log("   " + r.text.replace(/\s+/g, " ").slice(0, 110) + "...");
}