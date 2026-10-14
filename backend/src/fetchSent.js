import fs from "node:fs";
import { getGmail } from "./gmailClient.js";

const TARGET = Number(process.argv[2] ?? 300);
const CONCURRENCY = 5;
const OUT_DIR = new URL("../../data/", import.meta.url);
const OUT_FILE = new URL("raw-emails.json", OUT_DIR);

const gmail = getGmail();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const decode = (data) => Buffer.from(data, "base64url").toString("utf8");

async function withRetry(fn, attempts = 5) {
    for (let i = 0; ; i++) {
        try {
            return await fn();
        } catch (err) {
            const status = Number(err.code ?? err.status);
            const reason = err.response?.data?.error?.errors?.[0]?.reason ?? "";
            const retriable =
                [429, 500, 502, 503, 504].includes(status) || /rateLimit/i.test(reason);
            if (!retriable || i >= attempts - 1) throw err;
            const wait = 2 ** i * 1000 + Math.random() * 500;
            console.warn(`  Transient error (${status} ${reason}). Retrying in ${Math.round(wait)}ms...`);
            await sleep(wait);
        }
    }
}

async function listSentIds(target) {
    const ids = [];
    let pageToken;
    do {
        const { data } = await withRetry(() =>
            gmail.users.messages.list({
                userId: "me",
                labelIds: ["SENT"],
                maxResults: Math.min(100, target - ids.length),
                pageToken,
            })
        );
        ids.push(...(data.messages ?? []).map((m) => m.id));
        pageToken = data.nextPageToken;
        console.log(`  listed ${ids.length} IDs so far`);
    } while (pageToken && ids.length < target);
    return ids;
}

function findPart(part, mimeType) {
    if (part.mimeType === mimeType && part.body?.data) return part;
    for (const child of part.parts ?? []) {
        const found = findPart(child, mimeType);
        if (found) return found;
    }
    return null;
}

function hasAttachment(part) {
    if (part.filename) return true;
    return (part.parts ?? []).some(hasAttachment);
}

function toRecord(msg) {
    const h = (name) =>
        msg.payload.headers.find((x) => x.name.toLowerCase() === name)?.value ?? null;
    const plain = findPart(msg.payload, "text/plain");
    const html = findPart(msg.payload, "text/html");
    return {
        id: msg.id,
        threadId: msg.threadId,
        internalDate: Number(msg.internalDate),
        from: h("from"),
        to: h("to"),
        cc: h("cc"),
        subject: h("subject"),
        date: h("date"),
        inReplyTo: h("in-reply-to"),
        snippet: msg.snippet,
        hasAttachment: hasAttachment(msg.payload),
        textPlain: plain ? decode(plain.body.data) : null,
        textHtml: html ? decode(html.body.data) : null,
    };
}

async function mapPool(items, limit, worker) {
    let next = 0;
    const results = new Array(items.length);
    async function run() {
        while (next < items.length) {
            const i = next++;
            results[i] = await worker(items[i]);
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
    return results;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const existing = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, "utf8")) : [];
const have = new Set(existing.map((e) => e.id));

console.log(`Listing up to ${TARGET} sent message IDs...`);
const ids = await listSentIds(TARGET);
const todo = ids.filter((id) => !have.has(id));
console.log(`Found ${ids.length} IDs, ${ids.length - todo.length} already saved, fetching ${todo.length}.`);

let done = 0;
const fetched = await mapPool(todo, CONCURRENCY, async (id) => {
    try {
        const { data } = await withRetry(() =>
            gmail.users.messages.get({ userId: "me", id, format: "full" })
        );
        return toRecord(data);
    } catch (err) {
        console.warn(`  Skipping ${id}: ${err.code ?? ""} ${err.message}`);
        return null;
    } finally {
        done++;
        if (done % 25 === 0 || done === todo.length) console.log(`  fetched ${done}/${todo.length}`);
    }
});

const all = [...existing, ...fetched.filter(Boolean)].sort(
    (a, b) => b.internalDate - a.internalDate
);
fs.writeFileSync(OUT_FILE, JSON.stringify(all, null, 2));

const plainCount = all.filter((e) => e.textPlain).length;
const htmlOnly = all.filter((e) => !e.textPlain && e.textHtml).length;
const noBody = all.filter((e) => !e.textPlain && !e.textHtml).length;
const attach = all.filter((e) => e.hasAttachment).length;
const dates = all.map((e) => e.internalDate);

console.log("\nSaved to data/raw-emails.json");
console.log("Total emails:        ", all.length);
console.log("With text/plain:     ", plainCount);
console.log("HTML only:           ", htmlOnly);
console.log("No body found:       ", noBody);
console.log("With attachments:    ", attach);
if (dates.length) {
    console.log("Date range:          ", new Date(Math.min(...dates)).toDateString(), "to", new Date(Math.max(...dates)).toDateString());
}