import "https://squidly.com.au/Console/app.js"

window.open = function(url) {
    console.log("Opening URL in new window:", url);
    api.openWindow({url: url});
}