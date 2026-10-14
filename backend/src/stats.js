import fs from "node:fs";

const emails = JSON.parse(
    fs.readFileSync(new URL("../../data/raw-emails.json", import.meta.url), "utf8")
);

const words = (t) => (t ?? "").trim().split(/\s+/).filter(Boolean).length;
const lens = emails.map((e) => words(e.textPlain ?? e.snippet)).sort((a, b) => a - b);

const bucket = (lo, hi) => lens.filter((n) => n >= lo && n < hi).length;
console.log("Total emails:        ", emails.length);
console.log("Median words:        ", lens[Math.floor(lens.length / 2)]);
console.log("Under 10 words:      ", bucket(0, 10));
console.log("10-29 words:         ", bucket(10, 30));
console.log("30-99 words:         ", bucket(30, 100));
console.log("100+ words:          ", bucket(100, Infinity));
console.log("Replies:             ", emails.filter((e) => e.inReplyTo).length);

const domains = {};
for (const e of emails) {
    const m = (e.to ?? "").match(/@([\w.-]+)/);
    if (m) domains[m[1].toLowerCase()] = (domains[m[1].toLowerCase()] ?? 0) + 1;
}
console.log("Top recipient domains:");
console.table(Object.entries(domains).sort((a, b) => b[1] - a[1]).slice(0, 8));