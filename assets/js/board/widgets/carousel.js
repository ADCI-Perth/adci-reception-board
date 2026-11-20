/* --- CAROUSEL ENGINE --- (ported from Standard_reception_hub - v4.html 423-479)
   Only change: wrapped in start(config); media URLs built with mediaUrl() (encodeURI). */
import { mediaUrl } from '../config.js';
import { drawMap } from './map.js';

let CONFIG;
let playlistIndex = 0;
let rotationTimer;
let views, imgFg, imgBg, videoElement, videoSource;

function playNextSlide() {
    Object.values(views).forEach(el => el.classList.remove('active-view'));
    clearTimeout(rotationTimer);

    if (playlistIndex === 0) {
        views.map.classList.add('active-view');
        setTimeout(drawMap, 100);
        rotationTimer = setTimeout(nextIndex, CONFIG.mapDuration);
    }
    else if (playlistIndex > 0 && playlistIndex <= CONFIG.videos.length) {
        const videoIdx = playlistIndex - 1;
        const src = mediaUrl(CONFIG.videos[videoIdx]);
        views.video.classList.add('active-view');
        if (videoSource.getAttribute('src') !== src) {
            videoSource.setAttribute('src', src);
            videoElement.load();
        }
        videoElement.currentTime = 0;
        let playPromise = videoElement.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                videoElement.onended = () => { nextIndex(); };
            }).catch(err => { nextIndex(); });
        }
    }
    else {
        let photoIdx = playlistIndex - CONFIG.videos.length - 1;
        if (photoIdx < CONFIG.photos.length) {
            views.image.classList.add('active-view');
            const src = mediaUrl(CONFIG.photos[photoIdx]);
            imgFg.src = src;
            imgBg.style.backgroundImage = `url('${src}')`;
            imgFg.classList.remove('ken-burns');
            void imgFg.offsetWidth;
            imgFg.classList.add('ken-burns');
            rotationTimer = setTimeout(nextIndex, CONFIG.photoDuration);
        } else {
            playlistIndex = -1;
            nextIndex();
        }
    }
}
function nextIndex() { playlistIndex++; playNextSlide(); }

export function start(config) {
    CONFIG = config;
    views = {
        map: document.getElementById('view-map'),
        image: document.getElementById('view-image'),
        video: document.getElementById('view-video')
    };
    imgFg = document.getElementById('img-fg');
    imgBg = document.getElementById('img-bg');
    videoElement = document.getElementById('promo-video');
    videoSource = document.getElementById('promo-video-source');
    playNextSlide();
}
