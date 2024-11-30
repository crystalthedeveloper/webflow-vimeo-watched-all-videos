"use strict";

// Generate a unique key for each page based on the URL
const pageKey = window.location.pathname;

// Initialize separate videoWatched objects for guest and logged-in users
let guestVideoWatched = JSON.parse(localStorage.getItem(`guestVideoWatched_${pageKey}`)) || {};
let userVideoWatched = JSON.parse(localStorage.getItem(`userVideoWatched_${pageKey}`)) || {};
let totalVideos = new Set(); // Set to store unique video IDs per page

// Utility to determine if the current user is logged in
function isGuestVideo(element) {
    return element.classList.contains("guestvideo");
}

// Monitor for changes in the DOM (e.g., login state change)
function monitorLoginState() {
    const observer = new MutationObserver(() => {
        const isLoggedIn = document.querySelectorAll(".uservideo iframe[data-vimeo-id]").length > 0;

        const currentUserState = isLoggedIn ? "user" : "guest";
        const previousUserState = localStorage.getItem("currentUserState") || "guest";

        if (currentUserState !== previousUserState) {
            console.log("Login state updated:", isLoggedIn ? "Logged In" : "Guest");
            localStorage.setItem("currentUserState", currentUserState);

            // Reinitialize players with the new state
            initializeVimeoPlayers();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Mark a video as watched
function markVideoAsWatched(videoId, isGuest) {
    const videoWatched = isGuest ? guestVideoWatched : userVideoWatched;

    if (videoWatched[videoId]) {
        console.log(`Video ${videoId} is already marked as watched (${isGuest ? "guest" : "user"}).`);
        return; // Prevent duplicate marking
    }

    console.log(`Marking video ${videoId} as watched (${isGuest ? "guest" : "user"}).`);
    videoWatched[videoId] = true;

    const storageKey = isGuest ? `guestVideoWatched_${pageKey}` : `userVideoWatched_${pageKey}`;
    localStorage.setItem(storageKey, JSON.stringify(videoWatched));
    checkAllVideosWatched(isGuest);
}

// Check if all videos are watched
function checkAllVideosWatched(isGuest) {
    const videoWatched = isGuest ? guestVideoWatched : userVideoWatched;
    const watchedVideos = Object.keys(videoWatched).filter((id) => videoWatched[id]).length;

    console.log(
        `Checking all videos watched for ${isGuest ? "guest" : "user"}. Total: ${
            totalVideos.size
        }, Watched: ${watchedVideos}`
    );

    if (watchedVideos === totalVideos.size && totalVideos.size > 0) {
        console.log("All videos watched. Enabling quiz button...");
        enableQuizButton(isGuest);
    } else {
        disableQuizButton(isGuest);
    }
}

// Enable quiz button
function enableQuizButton(isGuest) {
    const buttonSelector = isGuest ? ".guest-quiz-button" : "#quiz-button";
    const button = document.querySelector(buttonSelector);
    if (button) {
        button.classList.add("enabled");
        button.classList.remove("disabled");
        button.style.pointerEvents = "auto";
        button.style.opacity = "1";
    }
}

// Disable quiz button
function disableQuizButton(isGuest) {
    const buttonSelector = isGuest ? ".guest-quiz-button" : "#quiz-button";
    const button = document.querySelector(buttonSelector);
    if (button) {
        button.classList.add("disabled");
        button.classList.remove("enabled");
        button.style.pointerEvents = "none";
        button.style.opacity = "0.5";
    }
}

// Initialize Vimeo players (only once per state)
function initializeVimeoPlayers() {
    console.log("Initializing Vimeo players...");

    // Clear previous video IDs to prevent duplicates
    totalVideos.clear();

    document.querySelectorAll("iframe[data-vimeo-id]").forEach((iframe) => {
        const videoId = iframe.getAttribute("data-vimeo-id");
        const isGuest = isGuestVideo(iframe.closest("div"));

        if (!totalVideos.has(videoId)) {
            totalVideos.add(videoId);

            console.log(`Initializing Vimeo player for video ID: ${videoId}, isGuestVideo: ${isGuest}`);

            const player = new Vimeo.Player(iframe);

            player.on("ended", () => {
                console.log(`Video ${videoId} ended.`);
                markVideoAsWatched(videoId, isGuest);
            });

            player.on("loaded", () => {
                console.log(`Video ${videoId} loaded successfully.`);
                checkAllVideosWatched(isGuest);
            });
        }
    });
}

// Load Vimeo Player API dynamically
function loadVimeoAPI(callback) {
    const script = document.createElement("script");
    script.src = "https://player.vimeo.com/api/player.js";
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
    console.log("Vimeo Player API loaded.");
}

// Start monitoring and initialize the app
document.addEventListener("DOMContentLoaded", () => {
    loadVimeoAPI(() => {
        initializeVimeoPlayers();
        monitorLoginState();
    });

    // Initialize state on page load
    const isLoggedIn = document.querySelectorAll(".uservideo iframe[data-vimeo-id]").length > 0;
    localStorage.setItem("currentUserState", isLoggedIn ? "user" : "guest");
});
