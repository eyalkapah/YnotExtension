console.log("disable auto play");
let injectedPlayerIframe = document.querySelector(".iframeFloaterPotential");

if (injectedPlayerIframe != null) {
  var iframeDocument =
    injectedPlayerIframe.contentDocument ||
    injectedPlayerIframe.contentWindow.document;

  if (injectedPlayerIframe && injectedPlayerIframe.contentWindow) {
    var readFlowInterval = setInterval(function() {
      if (injectedPlayerIframe.contentWindow.flowplayer) {
        clearInterval(readFlowInterval);

        console.log(`getting player...`);
        let player = injectedPlayerIframe.contentWindow.flowplayer(
          "#vastFlowPlayer"
        );
        if (player) {
          console.log("player found!");
          var readyPlayerState = setInterval(function() {
            if (!player.loading) {
              clearInterval(readyPlayerState);

              console.log("pausing player...");
              player.pause();
              console.log("Player paused");
            }
          }, 100);
        }

        console.log("Player JS loaded");
      }
    }, 100);
  }
}
