import { buildPrompt } from "./buildPrompt.js";

// Usage: npm run prompt -- "Dear Sir, I wanted to" --to prof.mehta@college.edu --subject "Extension request"
const args = process.argv.slice(2);
function flag(name) {
    const i = args.indexOf(name);
    if (i < 0) return undefined;
    const value = args[i + 1];
    args.splice(i, 2);
    return value;
}
const recipient = flag("--to");
const subject = flag("--subject");
const draft = args.join(" ").trim();

if (!draft) {
    console.log('Usage: npm run prompt -- "draft so far" [--to a@b.com] [--subject "..."]');
    process.exit(1);
}

const { system, user } = await buildPrompt({ draft, recipient, subject });
console.log("===== SYSTEM =====\n" + system);
console.log("\n===== USER =====\n" + user);