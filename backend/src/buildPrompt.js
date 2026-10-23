import { retrieve } from "./retrieve.js";

export const SYSTEM_PROMPT = `You are an email autocomplete engine. You continue an email draft exactly as its author would write it.

Rules:
- Output ONLY the continuation text: the next phrase or sentence the author would type (at most about 25 words).
- Match the author's greetings, formality, punctuation, sentence length and sign-offs shown in their past emails.
- Never repeat text already in the draft, never add quotes or explanations, and never write as an assistant.
- If the draft already reads as finished, output nothing.`;

export async function buildPrompt({ draft, recipient = "", subject = "", k = 3, styleProfile = "" }) {
    const query = [subject, draft].filter(Boolean).join("\n\n");
    const examples = await retrieve(query, { recipient, k });

    const exampleBlock = examples
        .map((e, i) => `<example id="${i + 1}" to="${e.to}" subject="${e.subject}">\n${e.text}\n</example>`)
        .join("\n");

    const profileBlock = styleProfile
        ? `<style_profile>\n${styleProfile}\n</style_profile>\n\n`
        : "";

    const user =
        `${profileBlock}<past_emails>\n${exampleBlock}\n</past_emails>\n\n` +
        `<draft to="${recipient}" subject="${subject}">\n${draft}</draft>\n\n` +
        `Continue the draft. Output only the next words the author would type.`;

    return { system: SYSTEM_PROMPT, user, examples };
}