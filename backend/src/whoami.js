import { getGmail } from "./gmailClient.js";

const gmail = getGmail();
const { data } = await gmail.users.getProfile({ userId: "me" });
console.log(`Connected as ${data.emailAddress} (${data.messagesTotal} messages total)`);