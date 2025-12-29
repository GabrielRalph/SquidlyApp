const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("api", {
    text: "Heyyy",
    openWindow: (d) => ipcRenderer.invoke("open-window", d),
    getSources: () => ipcRenderer.invoke("get-sources"),
})

// ipcRenderer.on("bounce", (event, data) => {
//     const customEvent = new CustomEvent('bounce', { detail: data });
//     window.dispatchEvent(customEvent);
// })
