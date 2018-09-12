console.log("disable auto play");
let iframe = document.querySelector(".iframeFloaterPotential");

if (iframe != null) {
  var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

  if (iframe && iframe.contentWindow) {
    var readFlowInterval = setInterval(function() {
      if (iframe.contentWindow.flowplayer) {
        clearInterval(readFlowInterval);

        console.log(`getting player...`);
        let player = iframe.contentWindow.flowplayer("#vastFlowPlayer");
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
