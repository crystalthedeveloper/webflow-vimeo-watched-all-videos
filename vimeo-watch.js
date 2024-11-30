"use strict";

// Generate a unique key for each page based on the URL
const pageKey = window.location.pathname;

// Initialize videoWatched objects for guest and logged-in users
const guestVideoWatched = JSON.parse(localStorage.getItem(`guestVideoWatched_${pageKey}`)) || {};
const userVideoWatched = JSON.parse(localStorage.getItem(`userVideoWatched_${pageKey}`)) || {};

const totalVideos = new Set(); // Store unique video IDs per page

// Detect login state based on the presence of specific elements
function isGuest() {
    return !document.querySelector(".watched_link1"); // Guests have no links
}

// Disable the quiz button
function disableQuizButton() {
    const button = document.querySelector(".quiz-button");
    if (button) {
        button.classList.add("disabled");
        button.style.pointerEvents = "none";
        button.style.opacity = "0.5";
    }
}

// Enable the quiz button if all videos are watched
function enableQuizButtonIfAllWatched() {
    const watchedCount = isGuest()
        ? Object.keys(guestVideoWatched).filter((id) => guestVideoWatched[id]).length
        : Object.keys(userVideoWatched).filter((id) => userVideoWatched[id]).length;

    if (watchedCount === totalVideos.size && totalVideos.size > 0) {
        const button = document.querySelector(".quiz-button");
        if (button) {
            button.classList.remove("disabled");
            button.style.pointerEvents = "auto";
            button.style.opacity = "1";
        }
    }
}

// Show user videos and hide guest videos
function toggleVideoVisibility(isLoggedIn) {
    const guestVideos = document.querySelectorAll(".guest_video");
    const userVideos = document.querySelectorAll(".user_video");

    if (isLoggedIn) {
        guestVideos.forEach((video) => video.classList.add("hidden"));
        userVideos.forEach((video) => video.classList.remove("hidden"));
    } else {
        guestVideos.forEach((video) => video.classList.remove("hidden"));
        userVideos.forEach((video) => video.classList.add("hidden"));
    }
}

// Unhide completion elements and attach click handlers
function unhideVideoComplete(videoId, chapter) {
    if (isGuest()) {
        $(`.guest_complete_${chapter}`).removeClass("hidden");
    } else {
        $(`.video_complete_${chapter}`).removeClass("hidden");

        // Attach click handlers to watched links
        const watchedLinks = {
            1: { link: ".watched_link1", tab: "[data-w-tab='Tab 1']" },
            2: { link: ".watched_link2", tab: "[data-w-tab='Tab 2']" },
        };

        const watchedLink = watchedLinks[chapter];
        if (watchedLink) {
            $(watchedLink.link).off("click").on("click", () => $(watchedLink.tab).click());
        }
    }

    enableQuizButtonIfAllWatched();
}

// Initialize Vimeo players
function initializeVimeoPlayers() {
    document.querySelectorAll("iframe[data-vimeo-id]").forEach((iframe) => {
        const videoId = iframe.getAttribute("data-vimeo-id");
        const chapter = parseInt(iframe.closest("[id^='Chapter']").id.replace("Chapter ", ""), 10);

        if (!totalVideos.has(videoId)) totalVideos.add(videoId);

        const player = new Vimeo.Player(iframe);

        player.on("ended", () => {
            const storageKey = isGuest() ? "guestVideoWatched" : "userVideoWatched";
            const videoWatched = isGuest() ? guestVideoWatched : userVideoWatched;

            videoWatched[videoId] = true;
            localStorage.setItem(`${storageKey}_${pageKey}`, JSON.stringify(videoWatched));

            unhideVideoComplete(videoId, chapter);
        });
    });
}

// Load external scripts dynamically
function loadScript(src, callback) {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
}

// Initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    disableQuizButton();
    loadScript("https://player.vimeo.com/api/player.js", initializeVimeoPlayers);

    // Toggle video visibility on user login state
    const isLoggedIn = !isGuest();
    toggleVideoVisibility(isLoggedIn);

    // Simulate user login event for testing (remove in production)
    setTimeout(() => {
        const event = new Event("userSignedIn");
        document.dispatchEvent(event);
    }, 5000);
});

// Handle user login to show/hide videos
document.addEventListener("userSignedIn", () => {
    toggleVideoVisibility(true);
    initializeVimeoPlayers(); // Ensure user videos are properly initialized
});