let windowResizeEventThrottle;

window.addEventListener('resize', function () {
  clearTimeout(windowResizeEventThrottle);

  windowResizeEventThrottle = setTimeout(function () {
    clearTimeout(windowResizeEventThrottle);

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            window.__markbot.sendMessageToWindow(taskRunnerId, listenerLabel, windowId, document.documentElement.clientWidth, document.documentElement.offsetHeight);
          });
        });
      });
    });
  }, 200);
});

return windowId;
