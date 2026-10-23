import fs from "node:fs";

const IN = new URL("../../data/manual-emails.txt", import.meta.url);
const OUT = new URL("../../data/manual-emails.json", import.meta.url);

if (!fs.existsSync(IN)) {
    console.error("data/manual-emails.txt not found.");
    process.exit(1);
}

const raw = fs.readFileSync(IN, "utf8").replace(/\r\n/g, "\n");
const blocks = raw.split(/\n-{3,}\n/).map((b) => b.trim()).filter(Boolean);

const emails = blocks.map((block, i) => {
    const lines = block.split("\n");
    const header = {};
    let idx = 0;
    while (idx < lines.length && /^(To|Subject|Date):/i.test(lines[idx])) {
        const [key, ...rest] = lines[idx].split(":");
        header[key.toLowerCase()] = rest.join(":").trim();
        idx++;
    }
    const date = header.date ? Date.parse(header.date) : NaN;
    return {
        id: `manual-${String(i + 1).padStart(3, "0")}`,
        to: header.to ?? "",
        subject: header.subject ?? "",
        internalDate: Number.isNaN(date) ? Date.now() - i * 86400000 : date,
        source: "manual",
        text: lines.slice(idx).join("\n").trim(),
    };
});

const bad = emails.filter((e) => !e.to || !e.text);
if (bad.length) {
    console.warn(`Warning: ${bad.length} email(s) missing To: or body:`, bad.map((e) => e.id).join(", "));
}

fs.writeFileSync(OUT, JSON.stringify(emails, null, 2));

const words = emails.map((e) => e.text.split(/\s+/).filter(Boolean).length);
const avg = words.length ? Math.round(words.reduce((a, b) => a + b, 0) / words.length) : 0;
const domains = new Set(
    emails.map((e) => (e.to.split("@")[1] ?? "").toLowerCase()).filter(Boolean)
);

console.log(`Saved ${emails.length} emails to data/manual-emails.json`);
console.log(`Average words: ${avg}, distinct recipient domains: ${domains.size}`);