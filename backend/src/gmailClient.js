import "dotenv/config";
import fs from "node:fs";
import { google } from "googleapis";

const TOKEN_PATH = new URL("../token.json", import.meta.url);

export function getGmail() {
    if (!fs.existsSync(TOKEN_PATH)) {
        throw new Error("token.json not found. Run `npm run auth` first.");
    }

    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `http://localhost:${process.env.PORT || 3000}/oauth2callback`
    );

    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    client.setCredentials(tokens);

    // When the access token is refreshed, save it. Google doesn't resend the refresh_token.
    client.on("tokens", (fresh) => {
        Object.assign(tokens, fresh);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), { mode: 0o600 });
    });

    return google.gmail({ version: "v1", auth: client });
}