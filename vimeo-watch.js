"use strict";

document.addEventListener("DOMContentLoaded", function () {
    console.log("Webflow fully loaded. Initializing Vimeo Watch Script...");

    const pageKey = window.location.pathname;
    let guestVideoWatched = JSON.parse(localStorage.getItem(`guestVideoWatched_${pageKey}`)) || {};
    let userVideoWatched = JSON.parse(localStorage.getItem(`userVideoWatched_${pageKey}`)) || {};
    let totalVideos = new Set();

    function markVideoAsWatched(videoId, isGuestVideo) {
        console.log(`Marking video ${videoId} as watched (${isGuestVideo ? "guest" : "user"})...`);
        const videoWatched = isGuestVideo ? guestVideoWatched : userVideoWatched;

        if (videoWatched[videoId]) return;
        videoWatched[videoId] = true;

        const storageKey = isGuestVideo ? `guestVideoWatched_${pageKey}` : `userVideoWatched_${pageKey}`;
        localStorage.setItem(storageKey, JSON.stringify(videoWatched));
        checkAllVideosWatched(isGuestVideo);
    }

    function checkAllVideosWatched(isGuestVideo) {
        const videoWatched = isGuestVideo ? guestVideoWatched : userVideoWatched;
        const watchedVideos = Object.keys(videoWatched).filter((id) => videoWatched[id]).length;

        console.log(
            `Checking videos for ${isGuestVideo ? "guest" : "user"}. Total: ${totalVideos.size}, Watched: ${watchedVideos}`
        );

        if (watchedVideos === totalVideos.size && totalVideos.size > 0) {
            enableQuizButton(isGuestVideo);
        } else {
            disableQuizButton(isGuestVideo);
        }
    }

    function enableQuizButton(isGuestVideo) {
        const buttonSelector = isGuestVideo ? ".guest-quiz-button" : "#quiz-button";
        const button = document.querySelector(buttonSelector);

        if (button) {
            button.classList.remove("disabled");
            button.classList.add("enabled");
            button.style.pointerEvents = "auto";
            button.style.opacity = "1";
            console.log(`Quiz button enabled for ${isGuestVideo ? "guest" : "user"}.`);
        } else {
            console.warn(`Quiz button (${buttonSelector}) not found. Retrying...`);
            setTimeout(() => enableQuizButton(isGuestVideo), 500);
        }
    }

    function disableQuizButton(isGuestVideo) {
        const buttonSelector = isGuestVideo ? ".guest-quiz-button" : "#quiz-button";
        const button = document.querySelector(buttonSelector);

        if (button) {
            button.classList.add("disabled");
            button.classList.remove("enabled");
            button.style.pointerEvents = "none";
            button.style.opacity = "0.5";
            console.log(`Quiz button disabled for ${isGuestVideo ? "guest" : "user"}.`);
        } else {
            console.warn(`Quiz button (${buttonSelector}) not found.`);
        }
    }

    function initializeVimeoPlayers() {
        console.log("Initializing Vimeo players...");
        const vimeoIframes = document.querySelectorAll("iframe[data-vimeo-id]");

        if (vimeoIframes.length === 0) {
            console.warn("No Vimeo iframes found on the page.");
            return;
        }

        vimeoIframes.forEach((iframe) => {
            const videoId = iframe.getAttribute("data-vimeo-id");
            const isGuestVideo = iframe.closest(".guestvideo") !== null;

            if (!totalVideos.has(videoId)) {
                totalVideos.add(videoId);
            }

            const player = new Vimeo.Player(iframe);

            player.on("ended", () => {
                markVideoAsWatched(videoId, isGuestVideo);
            });

            player.on("loaded", () => {
                checkAllVideosWatched(isGuestVideo);
            });
        });
    }

    // Initialize Vimeo players
    setTimeout(initializeVimeoPlayers, 500);
});
