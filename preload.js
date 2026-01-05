const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("api", {
    text: "Heyyy",
    openWindow: (d) => ipcRenderer.invoke("open-window", d),
    notifyLoginSuccess: () => ipcRenderer.send("login-success"),
    notifyShowLogin: () => ipcRenderer.send("show-login"),
    notifyLogout: () => ipcRenderer.send("logout"),
    closeLoginWindow: () => ipcRenderer.send("close-login-window"),
    goBackToLogin: () => ipcRenderer.send("go-back-to-login"),
    updateButtonMode: (mode) => ipcRenderer.send("update-button-mode", mode),
    openConsole: () => {
        console.log("[preload] openConsole called");
        ipcRenderer.send("open-console");
        console.log("[preload] open-console IPC message sent");
    },
})

console.log("[preload] API exposed to window.api");

// ipcRenderer.on("bounce", (event, data) => {
//     const customEvent = new CustomEvent('bounce', { detail: data });
//     window.dispatchEvent(customEvent);
// })
