import fs from "node:fs";
import { getGmail } from "./gmailClient.js";

const gmail = getGmail();

let id = process.argv[2];
if (!id) {
    const { data } = await gmail.users.messages.list({
        userId: "me",
        labelIds: ["SENT"],
        maxResults: 1,
    });
    id = data.messages?.[0]?.id;
    if (!id) {
        console.log("No sent messages found.");
        process.exit(0);
    }
}

const { data: msg } = await gmail.users.messages.get({
    userId: "me",
    id,
    format: "full",
});

const header = (name) =>
    msg.payload.headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;

const decode = (data) => Buffer.from(data, "base64url").toString("utf8");

function printTree(part, depth = 0) {
    const size = part.body?.size ?? 0;
    const file = part.filename ? ` [attachment: ${part.filename}]` : "";
    console.log(`${"  ".repeat(depth)}- ${part.mimeType} (${size} bytes)${file}`);
    (part.parts ?? []).forEach((p) => printTree(p, depth + 1));
}

function findPart(part, mimeType) {
    if (part.mimeType === mimeType && part.body?.data) return part;
    for (const child of part.parts ?? []) {
        const found = findPart(child, mimeType);
        if (found) return found;
    }
    return null;
}

console.log("ID:     ", msg.id);
console.log("From:   ", header("From"));
console.log("To:     ", header("To"));
console.log("Subject:", header("Subject"));
console.log("Date:   ", header("Date"));
console.log("Snippet:", msg.snippet);

console.log("\nMIME structure:");
printTree(msg.payload);

const plain = findPart(msg.payload, "text/plain");
const html = findPart(msg.payload, "text/html");

if (plain) {
    console.log("\n----- text/plain body (decoded) -----\n");
    console.log(decode(plain.body.data));
} else if (html) {
    console.log("\n----- no text/plain part; first 500 chars of text/html -----\n");
    console.log(decode(html.body.data).slice(0, 500));
} else {
    console.log("\nNo text body found at the top level or in parts.");
}

const outDir = new URL("../../data/", import.meta.url);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(new URL("sample-message.json", outDir), JSON.stringify(msg, null, 2));
console.log("\nSaved raw response to data/sample-message.json");