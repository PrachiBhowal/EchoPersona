const wordCount = (t) => t.trim().split(/\s+/).filter(Boolean).length;

const AUTOMATED_SUBJECT =
    /\b(verify your email|verification|reset your password|password reset|one[- ]time|otp|welcome to)\b|(sharing|shared) .{0,60}with you/i;
const AUTOMATED_BODY =
    /expires in \d+ (minutes?|hours?)|aka\.ms\/|unsubscribe|created and shared using|scanned (with|by) camscanner/i;
const FORWARD_START = /^-{3,}\s*forwarded message\s*-{3,}/i;

// Returns the reason an email should be dropped, or null to keep it.
export function dropReason(email, ownEmails) {
    const MIN_WORDS = Number(process.env.MIN_WORDS ?? 6);

    const recipients = (email.to ?? "").toLowerCase().match(/[\w.+-]+@[\w.-]+/g) ?? [];
    if (recipients.length && recipients.every((r) => ownEmails.includes(r))) {
        return "self-sent";
    }

    const body = email.text.replace(/\[image:[^\]]*\]/gi, "").trim();
    if (!body) return "empty-or-image-only";

    // Nothing written above the forwarded block, so there's no writing of yours here.
    if (FORWARD_START.test(body)) return "forward-only";

    if (AUTOMATED_SUBJECT.test(email.subject ?? "") || AUTOMATED_BODY.test(body)) {
        return "automated";
    }
    if (wordCount(body) < MIN_WORDS) return "too-short";

    return null;
}