import { getGmail } from "./gmailClient.js";

const gmail = getGmail();

const { data } = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["SENT"],
    maxResults: 10,
});

console.log("Estimated total sent:", data.resultSizeEstimate);
console.log("Next page token:", data.nextPageToken ?? "(none)");
console.log("First messages (list only returns id and threadId):");
console.table(data.messages ?? []);