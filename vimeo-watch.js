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

// Enable all quiz buttons for all chapters
function enableAllQuizButtons() {
    document.querySelectorAll(".quiz-button").forEach((button) => {
        button.classList.remove("disabled");
        button.style.pointerEvents = "auto";
        button.style.opacity = "1";
    });
    console.log("Enabled all quiz buttons.");
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

// Unhide completion elements dynamically and attach link handlers
function unhideVideoComplete(videoId, chapter, isGuestVideo) {
    console.log(`Attempting to unhide completion elements for video ID: ${videoId}, Chapter: ${chapter}`);
    const targetClass = isGuestVideo ? `.guest_complete_${chapter}` : `.video_complete_${chapter}`;
    const targetElements = document.querySelectorAll(targetClass);

    if (targetElements.length > 0) {
        targetElements.forEach((element) => element.classList.remove("hidden"));
        console.log(`Unhid completion elements for Chapter ${chapter} (${isGuestVideo ? "Guest" : "User"}).`);
    } else {
        console.warn(`No completion elements found for Chapter ${chapter} (${isGuestVideo ? "Guest" : "User"}).`);
    }

    // Attach click handler to watched links
    attachWatchedLinkClickHandler(chapter);
}

// Attach click handlers for watched links dynamically
function attachWatchedLinkClickHandler(chapter) {
    const watchedLink = document.querySelector(`.watched_link${chapter}`);
    const targetTab = document.querySelector(`[data-w-tab='Tab ${chapter}']`);

    if (!watchedLink || !targetTab) {
        console.warn(`Missing watched_link${chapter} or Tab ${chapter}.`);
        return;
    }

    // Attach a single click handler
    watchedLink.removeEventListener("click", handleWatchedLinkClick);
    watchedLink.addEventListener("click", handleWatchedLinkClick);

    function handleWatchedLinkClick(event) {
        event.preventDefault(); // Prevent default behavior
        targetTab.click(); // Simulate clicking the tab
        console.log(`Navigated to Tab ${chapter} via watched_link${chapter}.`);
    }
}

// Initialize Vimeo players dynamically
function initializeVimeoPlayers() {
    console.log("Initializing Vimeo players...");
    document.querySelectorAll("iframe[data-vimeo-id]").forEach((iframe) => {
        const videoId = iframe.getAttribute("data-vimeo-id");
        const chapter = parseInt(iframe.closest("[id^='Chapter']").id.replace("Chapter ", ""), 10);
        const isGuestVideo = iframe.closest(".guestvideo") !== null;

        console.log(
            `Initializing Vimeo player for video ID: ${videoId}, Chapter: ${chapter}, isGuestVideo: ${isGuestVideo}`
        );
        if (!totalVideos.has(videoId)) totalVideos.add(videoId);

        const player = new Vimeo.Player(iframe);

        player.on("ended", () => {
            console.log(`Video ${videoId} ended.`);
            markVideoAsWatched(videoId, isGuestVideo);
            unhideVideoComplete(videoId, chapter, isGuestVideo);
            enableQuizButtonForChapter(chapter);
        });

        player.on("loaded", () => {
            console.log(`Video ${videoId} loaded successfully.`);
            checkAllVideosWatched(isGuestVideo);
        });
    });
}

// Check all videos watched
function checkAllVideosWatched(isGuestVideo) {
    const videoWatched = isGuestVideo ? guestVideoWatched : userVideoWatched;
    const watchedVideos = Object.keys(videoWatched).filter((id) => videoWatched[id]).length;

    console.log(
        `Checking all videos watched for ${isGuestVideo ? "guest" : "user"}. Total videos: ${totalVideos.size}, Watched: ${watchedVideos}`
    );

    if (watchedVideos === totalVideos.size && totalVideos.size > 0) {
        console.log("All videos watched. Enabling all quiz buttons.");
        enableAllQuizButtons();
    }
}

// DOM Content Loaded handler
document.addEventListener("DOMContentLoaded", () => {
    disableAllQuizButtons(); // Disable all quiz buttons initially
    loadScript("https://player.vimeo.com/api/player.js", () => {
        initializeVimeoPlayers();

        // Attach handlers for watched links
        attachWatchedLinkClickHandler(1);
        attachWatchedLinkClickHandler(2);
        attachWatchedLinkClickHandler(3);
    });
});

// Load Vimeo Player API dynamically
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