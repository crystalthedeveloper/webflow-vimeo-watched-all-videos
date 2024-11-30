"use strict";

// Generate a unique key for each page based on the URL
const pageKey = window.location.pathname;

// Initialize separate videoWatched objects for guest and logged-in users
let guestVideoWatched = JSON.parse(localStorage.getItem(`guestVideoWatched_${pageKey}`)) || {};
let userVideoWatched = JSON.parse(localStorage.getItem(`userVideoWatched_${pageKey}`)) || {};

let totalVideos = new Set(); // Set to store unique video IDs per page

// Detect login state based on the presence of "uservideo" or "guestvideo" classes
function detectLoginState() {
    return document.querySelector(".uservideo") !== null;
}

// Enable a specific quiz button for the given chapter
function enableQuizButtonForChapter(chapter) {
    const button = document.querySelector(`#quiz-button-chapter-${chapter}`);
    if (button) {
        button.classList.remove("disabled");
        button.style.pointerEvents = "auto";
        button.style.opacity = "1";
        console.log(`Enabled quiz button for Chapter ${chapter}.`);
    } else {
        console.warn(`Quiz button for Chapter ${chapter} not found.`);
    }
}

// Mark video as watched
function markVideoAsWatched(videoId, isGuestVideo) {
    const videoWatched = isGuestVideo ? guestVideoWatched : userVideoWatched;

    if (videoWatched[videoId]) {
        console.log(`Video ${videoId} is already marked as watched (${isGuestVideo ? "guest" : "user"}).`);
        return; // Prevent duplicate marking
    }

    console.log(`Marking video ${videoId} as watched (${isGuestVideo ? "guest" : "user"}).`);
    videoWatched[videoId] = true;

    try {
        const storageKey = isGuestVideo ? `guestVideoWatched_${pageKey}` : `userVideoWatched_${pageKey}`;
        localStorage.setItem(storageKey, JSON.stringify(videoWatched));
        checkAllVideosWatched(isGuestVideo);
    } catch (error) {
        console.error("Error updating localStorage:", error);
    }
}

// Unhide completion elements dynamically
function unhideVideoComplete(videoId, chapter) {
    console.log(`Attempting to unhide completion elements for video ID: ${videoId}, Chapter: ${chapter}`);
    const targetClass = `.video_complete_${chapter}`;
    const targetElements = document.querySelectorAll(targetClass);

    if (targetElements.length > 0) {
        targetElements.forEach((element) => element.classList.remove("hidden"));
        console.log(`Unhid completion elements for Chapter ${chapter}.`);
    } else {
        console.warn(`No completion elements found for Chapter ${chapter}.`);
    }

    // Attach click handler to the watched link
    attachWatchedLinkClickHandler(chapter);
}

// Attach click handlers for watched links to navigate to the next tab
function attachWatchedLinkClickHandler(chapter) {
    const watchedLinkSelector = `.watched_link${chapter}`;
    const tabSelector = `[data-w-tab='Tab ${chapter + 1}']`; // Navigate to the next tab

    const watchedLink = document.querySelector(watchedLinkSelector);
    const nextTab = document.querySelector(tabSelector);

    if (watchedLink && nextTab) {
        watchedLink.addEventListener("click", () => {
            nextTab.click();
            console.log(`Navigated to Tab ${chapter + 1} via .watched_link${chapter}.`);
        });
    } else {
        console.warn(`Watched link or next tab not found for Chapter ${chapter}.`);
    }
}

// Check all videos watched
function checkAllVideosWatched(isGuestVideo) {
    const videoWatched = isGuestVideo ? guestVideoWatched : userVideoWatched;
    const watchedVideos = Object.keys(videoWatched).filter((id) => videoWatched[id]).length;

    console.log(`Checking all videos watched for ${isGuestVideo ? "guest" : "user"}. Total videos: ${totalVideos.size}, Watched: ${watchedVideos}`);
}

// Initialize Vimeo players dynamically
function initializeVimeoPlayers() {
    console.log("Initializing Vimeo players...");
    document.querySelectorAll("iframe[data-vimeo-id]").forEach((iframe) => {
        const videoId = iframe.getAttribute("data-vimeo-id");
        const chapter = parseInt(iframe.closest("[id^='Chapter']").id.replace("Chapter ", ""), 10);
        const isGuestVideo = iframe.closest(".guestvideo") !== null;

        console.log(`Initializing Vimeo player for video ID: ${videoId}, Chapter: ${chapter}, isGuestVideo: ${isGuestVideo}`);
        if (!totalVideos.has(videoId)) totalVideos.add(videoId);

        const player = new Vimeo.Player(iframe);

        player.on("ended", () => {
            console.log(`Video ${videoId} ended.`);
            markVideoAsWatched(videoId, isGuestVideo);
            unhideVideoComplete(videoId, chapter);
            enableQuizButtonForChapter(chapter);
        });

        player.on("loaded", () => {
            console.log(`Video ${videoId} loaded successfully.`);
            checkAllVideosWatched(isGuestVideo);
        });
    });
}

// Monitor DOM changes dynamically to detect login state
function monitorDomChanges() {
    const observer = new MutationObserver(() => {
        const isLoggedIn = detectLoginState();
        console.log(`Login state detected: ${isLoggedIn ? "Logged In" : "Guest"}`);
        initializeVimeoPlayers();
        disableAllQuizButtons(); // Reset buttons on DOM change
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

// Load Vimeo Player API and initialize
function loadScript(src, callback) {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
    console.log(`Loading script: ${src}`);
}

// On document ready
document.addEventListener("DOMContentLoaded", () => {
    disableAllQuizButtons(); // Disable all quiz buttons initially
    loadScript("https://player.vimeo.com/api/player.js", () => {
        initializeVimeoPlayers();
        monitorDomChanges(); // Start monitoring DOM changes
    });
});
