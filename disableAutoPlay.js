console.log("disable auto play");
let playerIframe = document.querySelector(".iframeFloaterPotential");

if (playerIframe != null) {
  var iframeDocument =
    playerIframe.contentDocument || playerIframe.contentWindow.document;

  if (playerIframe && playerIframe.contentWindow) {
    var readFlowInterval = setInterval(function() {
      if (playerIframe.contentWindow.flowplayer) {
        clearInterval(readFlowInterval);

        console.log(`getting player...`);
        let player = playerIframe.contentWindow.flowplayer("#vastFlowPlayer");
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
