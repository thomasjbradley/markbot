const __Markbot_Screenshotting_IPC_Renderer = nodeRequire('electron').ipcRenderer;

window.addEventListener('resize', function () {
  // Wait 4 animation frames—just to be sure
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          __Markbot_Screenshotting_IPC_Renderer.send(listenerLabel, document.documentElement.clientWidth, document.documentElement.offsetHeight);
        });
      });
    });
  });
});
