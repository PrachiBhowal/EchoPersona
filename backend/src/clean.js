import "dotenv/config";
import fs from "node:fs";
import { htmlToText, normalizeText, stripQuoted } from "./clean/extractText.js";
import { dropReason } from "./clean/filters.js";

const DATA = new URL("../../data/", import.meta.url);
const RAW = new URL("raw-emails.json", DATA);
const MANUAL = new URL("manual-emails.json", DATA);
const OUT = new URL("cleaned-emails.json", DATA);

const ownEmails = (process.env.OWN_EMAILS ?? "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
if (!ownEmails.length) console.warn("OWN_EMAILS is empty, so self-sent emails won't be filtered.");

const readJson = (url) => (fs.existsSync(url) ? JSON.parse(fs.readFileSync(url, "utf8")) : []);

const gmail = readJson(RAW).map((e) => {
    const source = e.textPlain ? "plain" : e.textHtml ? "html" : "none";
    const text =
        source === "plain" ? e.textPlain : source === "html" ? htmlToText(e.textHtml) : "";
    return {
        id: e.id,
        origin: "gmail",
        internalDate: e.internalDate,
        to: e.to,
        cc: e.cc,
        subject: e.subject,
        inReplyTo: e.inReplyTo,
        text: normalizeText(stripQuoted(text)),
    };
});

const manual = readJson(MANUAL).map((e) => ({
    id: e.id,
    origin: "manual",
    internalDate: e.internalDate ?? Date.now(),
    to: e.to,
    cc: null,
    subject: e.subject ?? "",
    inReplyTo: null,
    text: normalizeText(e.text ?? ""),
}));

const kept = [];
const dropped = {};
for (const email of [...gmail, ...manual]) {
    const reason = dropReason(email, ownEmails);
    if (reason) dropped[reason] = (dropped[reason] ?? 0) + 1;
    else kept.push(email);
}

kept.sort((a, b) => b.internalDate - a.internalDate);
fs.writeFileSync(OUT, JSON.stringify(kept, null, 2));

const words = kept.map((e) => e.text.split(/\s+/).filter(Boolean).length);
const avg = words.length ? Math.round(words.reduce((a, b) => a + b, 0) / words.length) : 0;

console.log("Saved data/cleaned-emails.json");
console.log("Gmail emails read:   ", gmail.length);
console.log("Manual emails read:  ", manual.length);
console.log("Kept:                ", kept.length);
console.log("Dropped by reason:   ", dropped);
console.log("Avg words per email: ", avg);