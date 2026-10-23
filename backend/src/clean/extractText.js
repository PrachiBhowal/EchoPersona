import { convert } from "html-to-text";

export function htmlToText(html) {
    return convert(html, {
        wordwrap: false,
        selectors: [
            { selector: "a", options: { ignoreHref: true } },
            { selector: "img", format: "skip" },
            { selector: "style", format: "skip" },
            { selector: "script", format: "skip" },
            { selector: "div.gmail_quote", format: "skip" },
            { selector: "blockquote", format: "skip" },
        ],
    });
}

export function normalizeText(text) {
    return text
        .replace(/\r\n?/g, "\n")
        .replace(/\u00a0/g, " ")
        .replace(/[\u200b-\u200d\ufeff]/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export function stripQuoted(text) {
    const lines = text.split("\n");
    const out = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // "On Tue, 13 Jan 2026, X <x@y.com> wrote:" (the header may wrap onto the next line)
        if (/^On\s.+/.test(line)) {
            if (/wrote:\s*$/.test(line)) continue;
            if (/^wrote:\s*$/.test(lines[i + 1] ?? "")) {
                i++;
                continue;
            }
        }

        if (/^>/.test(line)) continue; // quoted line

        // Everything after these markers is forwarded or quoted content.
        if (/^-{3,}\s*forwarded message\s*-{3,}/i.test(line)) break;
        if (/^From:\s.+/.test(line) && /^(Sent|Date):/i.test(lines[i + 1] ?? "")) break;
        if (/^--\s?$/.test(line)) break; // standard signature delimiter

        if (/^(Sent from my |Get Outlook for )/i.test(line)) continue;

        out.push(line);
    }
    return out.join("\n");
}