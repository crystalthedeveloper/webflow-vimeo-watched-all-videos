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

// Disable all quiz buttons
function disableAllQuizButtons() {
    document.querySelectorAll(".quiz-button").forEach((button) => {
        button.classList.add("disabled");
        button.style.pointerEvents = "none";
        button.style.opacity = "0.5";
        console.log("Disabled all quiz buttons.");
    });
}

// Enable specific quiz button
function enableQuizButtonForChapter(chapter) {
    const button = document.querySelector(`#quiz-button-chapter-${chapter}`);
    if (button) {
        button.classList.remove("disabled");
        button.style.pointerEvents = "auto";
        button.style.opacity = "1";
        console.log(`Enabled quiz button for Chapter ${chapter}.`);
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
function unhideVideoComplete(videoId, isGuestVideo) {
    console.log(`Attempting to unhide completion elements for video ID: ${videoId}`);
    const iframe = document.querySelector(`iframe[data-vimeo-id='${videoId}']`);

    if (iframe) {
        const chapter = iframe.id;
        console.log(`Found iframe for video ID: ${videoId}, Chapter ID: ${chapter}`);

        if (!chapter) {
            console.warn(`No chapter ID found for video ID: ${videoId}`);
            return;
        }

        const targetClass = isGuestVideo ? `.guest_complete_${chapter}` : `.video_complete_${chapter}`;
        const targetElements = document.querySelectorAll(targetClass);

        if (targetElements.length > 0) {
            targetElements.forEach((element) => element.classList.remove("hidden"));
            console.log(`Unhiding ${isGuestVideo ? "guest" : "user"} completion for Chapter ${chapter}`);
        } else {
            console.warn(`No matching ${isGuestVideo ? "guest" : "user"} completion elements for Chapter: ${chapter}`);
        }
    } else {
        console.warn(`No iframe found for video ID: ${videoId}`);
    }
}

// Check all videos watched
function checkAllVideosWatched(isGuestVideo) {
    const videoWatched = isGuestVideo ? guestVideoWatched : userVideoWatched;
    const watchedVideos = Object.keys(videoWatched).filter((id) => videoWatched[id]).length;

    console.log(
        `Checking all videos watched for ${isGuestVideo ? "guest" : "user"}. Total videos: ${totalVideos.size}, Watched: ${watchedVideos}`
    );

    if (watchedVideos === totalVideos.size && totalVideos.size > 0) {
        console.log(`All videos watched for ${isGuestVideo ? "guest" : "user"}. Enabling quiz button...`);
        enableQuizButtonForAllChapters(); // Enable all quiz buttons for completed videos
    } else {
        console.log(`Not all videos are watched for ${isGuestVideo ? "guest" : "user"}.`);
    }
}

// Enable all quiz buttons for completed chapters
function enableQuizButtonForAllChapters() {
    document.querySelectorAll(".quiz-button").forEach((button) => {
        button.classList.remove("disabled");
        button.style.pointerEvents = "auto";
        button.style.opacity = "1";
    });
    console.log("Enabled all quiz buttons.");
}

// Attach handlers to enable buttons and tabs
function attachTabClickHandlers() {
    document.querySelectorAll("[data-w-tab]").forEach((tab) => {
        const chapter = tab.getAttribute("data-w-tab").replace("Tab ", "");
        const watchedLinkSelector = `.watched_link${chapter}`;
        const tabSelector = `[data-w-tab='Tab ${chapter}']`;

        const watchedLink = document.querySelector(watchedLinkSelector);
        const tabElement = document.querySelector(tabSelector);

        if (watchedLink && tabElement) {
            watchedLink.addEventListener("click", () => {
                tabElement.click();
                enableQuizButtonForChapter(chapter);
                console.log(`Tab ${chapter} clicked. Quiz button enabled.`);
            });
        } else {
            console.warn(`Tab or watched link not found for Chapter ${chapter}.`);
        }
    });
}

// Monitor DOM changes dynamically to detect login state
function monitorDomChanges() {
    const observer = new MutationObserver(() => {
        const isLoggedIn = detectLoginState();
        console.log(`Login state detected: ${isLoggedIn ? "Logged In" : "Guest"}`);
        initializeVimeoPlayers();
        disableAllQuizButtons(); // Disable all buttons on DOM change
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

// Initialize Vimeo players dynamically
function initializeVimeoPlayers() {
    console.log("Initializing Vimeo players...");
    document.querySelectorAll("iframe[data-vimeo-id]").forEach((iframe) => {
        const videoId = iframe.getAttribute("data-vimeo-id");
        const isGuestVideo = iframe.closest(".guestvideo") !== null;

        console.log(`Initializing Vimeo player for video ID: ${videoId}, isGuestVideo: ${isGuestVideo}`);
        if (!totalVideos.has(videoId)) totalVideos.add(videoId);

        const player = new Vimeo.Player(iframe);

        player.on("ended", () => {
            console.log(`Video ${videoId} ended.`);
            markVideoAsWatched(videoId, isGuestVideo);
            unhideVideoComplete(videoId, isGuestVideo);
        });

        player.on("loaded", () => {
            console.log(`Video ${videoId} loaded successfully.`);
            checkAllVideosWatched(isGuestVideo);
        });
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
    attachTabClickHandlers(); // Attach tab click handlers
    loadScript("https://player.vimeo.com/api/player.js", () => {
        initializeVimeoPlayers();
        monitorDomChanges(); // Start monitoring DOM changes
    });
});
