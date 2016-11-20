const __Markbot_Screenshotting_IPC_Renderer = nodeRequire('electron').remote.BrowserWindow.fromId(taskRunnerId).webContents;
let windowResizeEventThrottle;

window.addEventListener('resize', function () {
  clearTimeout(windowResizeEventThrottle);

  windowResizeEventThrottle = setTimeout(function () {
    clearTimeout(windowResizeEventThrottle);

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            __Markbot_Screenshotting_IPC_Renderer.send(listenerLabel, windowId, document.documentElement.clientWidth, document.documentElement.offsetHeight);
          });
        });
      });
    });
  }, 200);
});

return windowId;
