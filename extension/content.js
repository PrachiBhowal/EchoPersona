console.log("[EchoPersona] content script loaded on", window.location.href);


window.addEventListener("hashchange", () => {
    console.log("[EchoPersona] Gmail view changed:", window.location.hash);
});