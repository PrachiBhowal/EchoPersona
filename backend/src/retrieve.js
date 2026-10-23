import fs from "node:fs";
import { embedTexts, cosine } from "./embed.js";

const DATA = new URL("../../data/embeddings.json", import.meta.url);
let cache;
const load = () => (cache ??= JSON.parse(fs.readFileSync(DATA, "utf8")));

// Public mail domains say nothing about who the recipient is.
const PUBLIC_DOMAINS = new Set(["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "live.com"]);
const addresses = (s) => (s ?? "").toLowerCase().match(/[\w.+-]+@[\w.-]+/g) ?? [];
const domainOf = (addr) => addr.split("@")[1];

export const BOOST = { sameAddress: 0.1, sameDomain: 0.05 };

// Returns the top-k past emails for a query, optionally boosted by recipient.
export async function retrieve(query, { recipient, k = 3 } = {}) {
    const records = load();
    const [queryVector] = await embedTexts([query]);
    const target = addresses(recipient)[0];

    return records
        .map((r) => {
            const similarity = cosine(queryVector, r.vector);
            let boost = 0;
            if (target) {
                const theirs = addresses(r.to);
                const targetDomain = domainOf(target);
                if (theirs.includes(target)) boost = BOOST.sameAddress;
                else if (!PUBLIC_DOMAINS.has(targetDomain) && theirs.some((a) => domainOf(a) === targetDomain)) {
                    boost = BOOST.sameDomain;
                }
            }
            return {
                id: r.id,
                origin: r.origin,
                to: r.to,
                subject: r.subject,
                text: r.text,
                similarity,
                boost,
                score: similarity + boost,
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
}