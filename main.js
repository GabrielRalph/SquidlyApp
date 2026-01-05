const {screen, dialog, app, BrowserWindow, ipcMain, Menu, MenuItem} = require("electron");
const path = require("path");
const isMac = process.platform === 'darwin'


class SquidlyElectronApp {
    loginWindow = null;
    dashboardWindow = null;
    mainWindow = null;
    logoWindow = null;
    buttonWindow = null;
    isTransitioning = false;

    constructor() {
        this.initialise()
    }

    updateTitle(){
        if (this.mainWindow) {
            this.mainWindow.setTitle("Squidly");
        }
    }

    getBaseURL() {
        const USE_LOCAL = process.env.USE_LOCAL === 'true' || process.argv.includes('--local');
        return USE_LOCAL ? "http://localhost:8080" : "https://squidly.com.au";
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

    createLogoWindow(){
        if (this.logoWindow) return;

        const parentWindow = this.loginWindow || this.mainWindow;
        if (!parentWindow) return;

        const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
        const logoSize = 130;
        const logoX = Math.floor((screenWidth - logoSize) / 2);
        const logoY = this.loginWindow ? this.loginWindow.getBounds().y - logoSize - 20 : 0;
        
        this.logoWindow = new BrowserWindow({
            width: logoSize,
            height: logoSize,
            x: logoX,
            y: logoY,
            parent: parentWindow,
            frame: false,
            transparent: true,
            alwaysOnTop: false,
            resizable: false,
            movable: false,
            hasShadow: false,
            skipTaskbar: true,
            backgroundColor: '#00000000',
            show: false,
            focusable: false,
            webPreferences: {
                backgroundThrottling: false,
                transparent: true
            }
        });
        
        this.logoWindow.loadFile(path.join(__dirname, "WebView", "loader.html"));
        
        this.logoWindow.once('ready-to-show', () => {
            parentWindow.on('show', () => {
                if (this.logoWindow && !this.logoWindow.isDestroyed()) {
                    this.logoWindow.show();
                }
            });
            parentWindow.on('hide', () => {
                if (this.logoWindow && !this.logoWindow.isDestroyed()) {
                    this.logoWindow.hide();
                }
            });
            if (parentWindow.isVisible()) {
                this.logoWindow.show();
            }
        });

        this.logoWindow.on('closed', () => {
            this.logoWindow = null;
        });
    }

    closeLogoWindow(){
        if (this.logoWindow) {
            this.logoWindow.close();
            this.logoWindow = null;
        }
    }

    createButtonWindow(){
        if (this.buttonWindow) return;

        const parentWindow = this.loginWindow;
        if (!parentWindow) return;

        const loginBounds = parentWindow.getBounds();
        const buttonSize = 60;
        const offset = 10;
        const buttonX = loginBounds.x + loginBounds.width + offset;
        const buttonY = loginBounds.y - buttonSize - offset;
        
        this.buttonWindow = new BrowserWindow({
            width: buttonSize,
            height: buttonSize,
            x: buttonX,
            y: buttonY,
            frame: false,
            transparent: true,
            alwaysOnTop: false,
            parent: parentWindow,
            resizable: false,
            movable: false,
            hasShadow: false,
            skipTaskbar: true,
            backgroundColor: '#00000000',
            show: false,
            focusable: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, "./preload.js"),
                backgroundThrottling: false,
                transparent: true
            }
        });
        
        const buttonHTML = `<!DOCTYPE html><html style="background:transparent;margin:0;padding:0;width:100%;height:100%;"><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}html{background:transparent!important;margin:0;padding:0;width:100%;height:100%}body{width:100%;height:100%;background:transparent!important;margin:0;padding:0;overflow:hidden;display:flex;align-items:center;justify-content:center}.close-btn{width:36px;height:36px;border-radius:50%;border:none;background:white;color:#333;font-size:18px;font-weight:500;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:none;transition:transform 0.15s ease}.close-btn:hover{transform:translateY(-1px)}.close-btn:active{transform:translateY(0)}</style></head><body><button class="close-btn" id="close-back-btn" title="Close">×</button><script>const btn=document.getElementById('close-back-btn');btn.onclick=function(e){e.preventDefault();e.stopPropagation();if(window.api&&window.api.closeLoginWindow){window.api.closeLoginWindow()}};</script></body></html>`;
        this.buttonWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(buttonHTML)}`);
        
        this.buttonWindow.once('ready-to-show', () => {
            const buttonSize = 60;
            const offset = 10;
            const updatePosition = () => {
                if (this.buttonWindow && !this.buttonWindow.isDestroyed() && parentWindow) {
                    const loginBounds = parentWindow.getBounds();
                    const buttonX = loginBounds.x + loginBounds.width + offset;
                    const buttonY = loginBounds.y - buttonSize - offset;
                    this.buttonWindow.setBounds({ x: buttonX, y: buttonY, width: buttonSize, height: buttonSize });
                }
            };

            parentWindow.on('show', () => {
                if (this.buttonWindow && !this.buttonWindow.isDestroyed()) {
                    updatePosition();
                    this.buttonWindow.show();
                }
            });
            parentWindow.on('hide', () => {
                if (this.buttonWindow && !this.buttonWindow.isDestroyed()) {
                    this.buttonWindow.hide();
                }
            });
            parentWindow.on('move', updatePosition);
            parentWindow.on('resize', updatePosition);
            
            if (parentWindow.isVisible()) {
                updatePosition();
                this.buttonWindow.show();
            }
        });

        this.buttonWindow.on('closed', () => {
            this.buttonWindow = null;
        });
    }

    closeButtonWindow(){
        if (this.buttonWindow) {
            this.buttonWindow.close();
            this.buttonWindow = null;
        }
    }


    createLoginWindow(){
        if (this.loginWindow) {
            this.loginWindow.focus();
            return;
        }

        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
        const loginWidth = 420;
        const loginHeight = 480;
        const x = Math.floor((screenWidth - loginWidth) / 2);
        const y = Math.floor((screenHeight - loginHeight) / 2);

        this.loginWindow = new BrowserWindow({
            width: loginWidth,
            height: loginHeight,
            x: x,
            y: y,
            frame: false,
            transparent: false,
            resizable: false,
            movable: false,
            show: false,
            backgroundColor: '#ffffff',
            webPreferences: {
                preload: path.join(__dirname, "./preload.js"),
                partition: 'persist:main',
                backgroundThrottling: false
            }
        });
        
        this.loginWindow.once('ready-to-show', () => {
            this.loginWindow.show();
            this.createLogoWindow();
            this.createButtonWindow();
        });

        this.loginWindow.on('closed', () => {
            this.loginWindow = null;
            this.closeLogoWindow();
            this.closeButtonWindow();
        });

        const USE_LOCAL = process.env.USE_LOCAL === 'true' || process.argv.includes('--local');
        if (USE_LOCAL) {
            this.loginWindow.webContents.session.clearCache();
        }
        this.loginWindow.loadURL(`${this.getBaseURL()}/Console/`);
    }

    createDashboardWindow(){
        if (this.dashboardWindow) {
            this.dashboardWindow.focus();
            return;
        }

        const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
        const dashboardWidth = Math.min(1100, screenWidth - 100);
        const dashboardHeight = Math.min(750, screenHeight - 100);
        
        this.dashboardWindow = new BrowserWindow({
            width: dashboardWidth,
            height: dashboardHeight,
            frame: true,
            resizable: true,
            movable: true,
            center: true,
            show: false,
            webPreferences: {
                preload: path.join(__dirname, "./preload.js"),
                partition: 'persist:main',
                contextIsolation: true,
                nodeIntegration: false
            }
        });

        this.dashboardWindow.once('ready-to-show', () => {
            this.dashboardWindow.show();
        });

        this.dashboardWindow.on('closed', () => {
            this.dashboardWindow = null;
        });

        this.dashboardWindow.loadURL(`${this.getBaseURL()}/Dashboard/`);
    }

    createMainWindow(){
        if (this.mainWindow) {
            this.mainWindow.focus();
            return;
        }

        const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
        const appWidth = Math.min(1200, screenWidth - 100);
        const appHeight = Math.min(800, screenHeight - 100);
        
        this.mainWindow = new BrowserWindow({
            width: appWidth,
            height: appHeight,
            frame: true,
            resizable: true,
            movable: true,
            center: true,
            show: false,
            webPreferences: {
                preload: path.join(__dirname, "./preload.js"),
                partition: 'persist:main'
            }
        });

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        this.mainWindow.loadURL(`${this.getBaseURL()}/Console/`);
    }

    async switchToDashboardWindow(){
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        try {
            if (this.loginWindow?.isVisible()) {
                this.loginWindow.hide();
            }
            
            if (!this.dashboardWindow) {
                this.createDashboardWindow();
                await new Promise((resolve) => {
                    if (!this.dashboardWindow) {
                        resolve();
                        return;
                    }
                    let resolved = false;
                    const check = () => {
                        if (!resolved && !this.dashboardWindow.webContents.isLoading()) {
                            resolved = true;
                            resolve();
                        }
                    };
                    this.dashboardWindow.webContents.once('did-finish-load', check);
                    this.dashboardWindow.once('ready-to-show', check);
                    setTimeout(check, 1000);
                });
            } else {
                this.dashboardWindow.show();
                this.dashboardWindow.focus();
            }
            
            if (this.loginWindow) {
                this.loginWindow.close();
                this.loginWindow = null;
            }
            this.closeLogoWindow();
            this.closeButtonWindow();
        } finally {
            this.isTransitioning = false;
        }
    }

    async openConsoleWindow(){
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        try {
            if (!this.mainWindow) {
                this.createMainWindow();
                await new Promise((resolve) => {
                    if (!this.mainWindow) {
                        resolve();
                        return;
                    }
                    let resolved = false;
                    const check = () => {
                        if (!resolved && !this.mainWindow.webContents.isLoading()) {
                            resolved = true;
                            resolve();
                        }
                    };
                    this.mainWindow.webContents.once('did-finish-load', check);
                    this.mainWindow.once('ready-to-show', check);
                    setTimeout(check, 1000);
                });
                this.mainWindow.webContents.executeJavaScript(`
                    if (window.appView) {
                        window.appView.panel = 'dashboard-welcome';
                    }
                `).catch(() => {});
            } else {
                this.mainWindow.show();
                this.mainWindow.focus();
                this.mainWindow.webContents.executeJavaScript(`
                    if (window.appView) {
                        window.appView.panel = 'dashboard-welcome';
                    }
                `).catch(() => {});
            }
        } finally {
            this.isTransitioning = false;
        }
    }
    
    async switchToLoginWindow(){
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        try {
            if (this.mainWindow) {
                this.mainWindow.close();
                this.mainWindow = null;
            }
            
            if (!this.loginWindow) {
                this.createLoginWindow();
            } else {
                this.createLogoWindow();
                this.createButtonWindow();
                this.loginWindow.show();
                this.loginWindow.focus();
            }
        } finally {
            this.isTransitioning = false;
        }
    }


    openSessionWindow(url) {
        let query = url.split("?")[1] || "";
        let sessionWindow = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                preload: path.join(__dirname, "./preload.js"),
                partition: 'persist:main'
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
    }


    async initialise() {
        app.on("window-all-closed", () => {
            this.closeLogoWindow();
            if (process.platform !== "darwin") {
                app.quit();
            }
        });

        app.on('activate', () => {
            if (this.mainWindow) {
                this.mainWindow.show();
            } else if (this.loginWindow) {
                this.loginWindow.show();
                if (!this.logoWindow) {
                    this.createLogoWindow();
                }
            } else {
                this.createLoginWindow();
            }
        });

        app.on('before-quit', () => {
            app.isQuitting = true;
        });

        ipcMain.handle("open-window", async (req, data) => {
            let isSession = data.url.startsWith("file:///V3");
            if (isSession) {
                this.openSessionWindow(data.url);
            } else if (data.url.startsWith("https://verify.squidly.com.au")) {
                this.openLink(data.url);
            }
        });

        ipcMain.on('login-success', () => {
            this.switchToDashboardWindow();
        });

        ipcMain.on('open-console', () => {
            this.openConsoleWindow();
        });
        
        ipcMain.on('show-login', () => {
            this.switchToLoginWindow();
        });
        
        ipcMain.on('logout', () => {
            if (this.dashboardWindow) {
                this.dashboardWindow.close();
                this.dashboardWindow = null;
            }
            if (this.mainWindow) {
                this.mainWindow.close();
                this.mainWindow = null;
            }
            this.switchToLoginWindow();
        });
        
        ipcMain.on('close-login-window', () => {
            if (this.loginWindow) {
                this.loginWindow.close();
            }
        });

        ipcMain.on('go-back-to-login', () => {
            if (this.loginWindow && this.loginWindow.webContents) {
                this.loginWindow.webContents.executeJavaScript(`
                    (function() {
                        const loginPage = document.querySelector('login-page');
                        if (loginPage) {
                            loginPage.mode = 'sign-in';
                        }
                    })();
                `).catch(() => {});
            }
        });

        app.commandLine.appendSwitch("enable-gpu-rasterization");
        app.commandLine.appendSwitch("enable-zero-copy");
        app.commandLine.appendSwitch("ignore-gpu-blocklist");

        await app.whenReady();
        this.createLoginWindow();
    }
}


new SquidlyElectronApp()
