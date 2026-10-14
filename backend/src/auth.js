import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import express from "express";
import { google } from "googleapis";

const PORT = process.env.PORT || 3000;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_PATH = new URL("../token.json", import.meta.url);

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in backend/.env");
    process.exit(1);
}

const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
const state = crypto.randomBytes(16).toString("hex"); // CSRF protection

const app = express();

// Visiting http://localhost:3000 sends you to Google's consent page.
app.get("/", (_req, res) => {
    const url = client.generateAuthUrl({
        access_type: "offline", // ask for a refresh token
        prompt: "consent",      // always return the refresh token, even on re-login
        scope: SCOPES,
        state,
    });
    res.redirect(url);
});

// Google redirects back here with ?code=... after you approve.
app.get("/oauth2callback", async (req, res) => {
    const { code, state: returnedState, error } = req.query;

    if (error) {
        res.status(400).send(`Google returned an error: ${error}`);
        return finish(1, `OAuth error: ${error}`);
    }
    if (returnedState !== state) {
        res.status(400).send("State mismatch. Please run `npm run auth` again.");
        return finish(1, "State mismatch");
    }

    try {
        const { tokens } = await client.getToken(code);
        if (!tokens.refresh_token) {
            console.warn("No refresh_token received. Revoke the app at myaccount.google.com/permissions and retry.");
        }
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), { mode: 0o600 });

        client.setCredentials(tokens);
        const gmail = google.gmail({ version: "v1", auth: client });
        const { data } = await gmail.users.getProfile({ userId: "me" });

        res.send(`Authorized as ${data.emailAddress}. You can close this tab.`);
        finish(0, `Authorized as ${data.emailAddress}. Token saved to backend/token.json`);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Token exchange failed. Check the terminal.");
        finish(1, "Token exchange failed");
    }
});

const server = app.listen(PORT, () => {
    console.log(`Open http://localhost:${PORT} in your browser to log in with Google.`);
});

function finish(code, message) {
    console.log(message);
    setTimeout(() => server.close(() => process.exit(code)), 300);
}