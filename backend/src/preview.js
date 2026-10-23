import fs from "node:fs";

// Usage: npm run preview                -> 5 random emails
//        npm run preview -- 10          -> 10 random emails
//        npm run preview -- 10 gmail    -> only emails from Gmail
//        npm run preview -- 10 manual   -> only your hand-written emails
const count = Number(process.argv[2] ?? 5);
const onlyOrigin = process.argv[3];

const emails = JSON.parse(
    fs.readFileSync(new URL("../../data/cleaned-emails.json", import.meta.url), "utf8")
).filter((e) => !onlyOrigin || e.origin === onlyOrigin);

const picked = [...emails].sort(() => Math.random() - 0.5).slice(0, count);

for (const e of picked) {
    console.log("=".repeat(70));
    console.log(`To: ${e.to} | ${e.subject} | ${new Date(e.internalDate).toDateString()} | origin: ${e.origin}`);
    console.log("-".repeat(70));
    console.log(e.text.length > 800 ? e.text.slice(0, 800) + "\n[...truncated]" : e.text || "(empty)");
}