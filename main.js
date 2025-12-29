const {screen, dialog, app, BrowserWindow, ipcMain, Menu, MenuItem, desktopCapturer} = require("electron");
const path = require("path");
const isMac = process.platform === 'darwin'


class SquidlyElectronApp {
    /** @type {BrowserWindow} */
    window = null;

    constructor() {
        this.initialise()
    }

    updateTitle(){
        this.window.setTitle("Squidly");
    }


    getDefaultMenu(devices) {
        const template = [
        ...(isMac
            ? [{
                label: app.name,
                submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
                ]
            }]
            : []),
        {
            label: 'File',
            submenu: [
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        {
            label: "devices",
            submenu: devices
        },
        {
            label: 'Edit',
            submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...(isMac
                ? [
                    { role: 'pasteAndMatchStyle' },
                    { role: 'delete' },
                    { role: 'selectAll' },
                    { type: 'separator' },
                    {
                    label: 'Speech',
                    submenu: [
                        { role: 'startSpeaking' },
                        { role: 'stopSpeaking' }
                    ]
                    }
                ]
                : [
                    { role: 'delete' },
                    { type: 'separator' },
                    { role: 'selectAll' }
                ])
            ]
        },
        {
            label: 'View',
            submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            ...(isMac
                ? [
                    { type: 'separator' },
                    { role: 'front' },
                    { type: 'separator' },
                    { role: 'window' }
                ]
                : [
                    { role: 'close' }
                ])
            ]
        },
        {
            role: 'help',
            submenu: [
            {
                label: 'Learn More',
            }
            ]
        }
        ]  
        return Menu.buildFromTemplate(template); 
    }


    openLink(url) {
        let window = new BrowserWindow({
            width: 800,
            height: 600,
        })
        window.loadURL(url);
    }


    createWindow(){
        this.window = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                preload: path.join(__dirname, "./preload.js")
            }
        })
        this.window.loadFile("./WebView/Console/index.html");


        ipcMain.handle("open-window", async (req, data) => {
            let isSession = data.url.startsWith("file:///V3");
            if (isSession) {
                this.openSessionWindow(data.url);
            } else if (data.url.startsWith("https://verify.squidly.com.au")) {
                this.openLink(data.url);
            }
        })

        ipcMain.handle('get-sources', async () => {
            const sources = await desktopCapturer.getSources({
                types: ['window', 'screen'],
                thumbnailSize: { width: 300, height: 200 }
            });
            return sources.map(source => ({
                id: source.id,
                name: source.name,
                thumbnail: source.thumbnail.toDataURL()
            }));
        });
    }


    createShareBorder(bounds) {
        // Overlay.create(bounds.x, bounds.y, bounds.width, bounds.height, 'red');
    }


    openSessionWindow(url) {
        let query = url.split("?")[1] || "";
        let sessionWindow = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                preload: path.join(__dirname, "./preload.js")
            }
        })
        
        const filePath = path.join(
            __dirname,
            "WebView",
            "Session",
            "index.html"
        );

        const formatURL = new URL(`file://${filePath}`);
        formatURL.search = `?${encodeURIComponent(query)}`;
        sessionWindow.loadURL(formatURL.toString());

        const primary = screen.getPrimaryDisplay().bounds;
        this.createShareBorder(primary);
    }


    async initialise() {
        app.on("window-all-closed", () => {
            if (process.platform !== "darwin") app.quit();
        })

        app.commandLine.appendSwitch("enable-gpu-rasterization");
        app.commandLine.appendSwitch("enable-zero-copy");
        app.commandLine.appendSwitch("ignore-gpu-blocklist");

        await app.whenReady();

    
        this.createWindow();

        
    }
}


new SquidlyElectronApp()
