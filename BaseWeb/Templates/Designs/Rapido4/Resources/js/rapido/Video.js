//This code based on instructions from https://developers.google.com/youtube/iframe_api_reference

document.addEventListener("DOMContentLoaded", function () {
    var tag = document.createElement('script');

    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // 3. This function creates an <iframe> (and YouTube player)
    //    after the API code downloads.

});

function onYouTubeIframeAPIReady() {
    document.querySelectorAll('.js-youtube-video').forEach(function (el) {
        var videoId = el.getAttribute('data-video');
        var elId = el.getAttribute('id');
        var autoPlay = el.getAttribute('data-auto-play') != null ? el.getAttribute('data-auto-play') : 1;
        var controls = el.getAttribute('data-enable-controls') != null ? el.getAttribute('data-enable-controls') : 0;
        var mute = autoPlay = 1 ? 1 : 0;


        player = new YT.Player(elId, {
            videoId: videoId,                                                                                        
            playerVars: {
                autoplay: 0,
                controls: controls,
                loop: 1,
                playlist: videoId,
                playsinline: 1,
                showinfo: 0,
                disablekb: 1,
                modestbranding: 1,
                mute: mute,
                rel: 0
            },
            events: {
                'onReady': onPlayerReady,
                'onError': onError
            }
        });
    });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    //event.target.playVideo();
}

function onError(event) {
    event.target.a.style.display = "none";
}