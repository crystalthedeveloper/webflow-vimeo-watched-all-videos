"use strict";

// Generate a unique key for each page based on the URL
const pageKey = window.location.pathname;

// Initialize separate videoWatched objects for guest and logged-in users
let guestVideoWatched = JSON.parse(localStorage.getItem(`guestVideoWatched_${pageKey}`)) || {};
let userVideoWatched = JSON.parse(localStorage.getItem(`userVideoWatched_${pageKey}`)) || {};
let totalVideos = new Set(); // Set to store unique video IDs per page

// Function to check if the user is logged in
function isUserLoggedIn() {
    return document.body.hasAttribute("data-wf-user"); // Adjust as per Webflow's implementation
}

// Function to dynamically detect login state changes
function checkLoginStateAndRefresh() {
    const currentUserState = isUserLoggedIn();
    const previousUserState = JSON.parse(localStorage.getItem(`currentUserState_${pageKey}`)) || false;

    if (currentUserState !== previousUserState) {
        console.log("Login state changed. Refreshing...");
        localStorage.setItem(`currentUserState_${pageKey}`, JSON.stringify(currentUserState));

        // Reset video watched data and reinitialize players
        guestVideoWatched = {};
        userVideoWatched = {};
        totalVideos = new Set();
        initializeVimeoPlayers(); // Reinitialize Vimeo players with updated state
    }
}

// Mark video as watched
function markVideoAsWatched(videoId, isGuestVideo) {
    const videoWatched = isGuestVideo ? guestVideoWatched : userVideoWatched;
    if (videoWatched[videoId]) return;

    videoWatched[videoId] = true;
    const storageKey = isGuestVideo ? `guestVideoWatched_${pageKey}` : `userVideoWatched_${pageKey}`;
    localStorage.setItem(storageKey, JSON.stringify(videoWatched));
    checkAllVideosWatched(isGuestVideo);
}

// Check all videos watched
function checkAllVideosWatched(isGuestVideo) {
    const videoWatched = isGuestVideo ? guestVideoWatched : userVideoWatched;
    const watchedCount = Object.keys(videoWatched).filter((id) => videoWatched[id]).length;

    console.log(
        `Checking videos watched for ${isGuestVideo ? "guest" : "user"}. Total: ${totalVideos.size}, Watched: ${watchedCount}`
    );

    if (watchedCount === totalVideos.size && totalVideos.size > 0) {
        console.log("All videos watched. Enabling quiz button...");
        enableQuizButton(isGuestVideo);
    } else {
        disableQuizButton(isGuestVideo);
    }
}

// Enable quiz button
function enableQuizButton(isGuestVideo) {
    const buttonSelector = isGuestVideo ? ".guest-quiz-button" : "#quiz-button";
    const button = document.querySelector(buttonSelector);
    if (button) {
        button.classList.add("enabled");
        button.classList.remove("disabled");
        button.style.pointerEvents = "auto";
        button.style.opacity = "1";
    }
}

// Disable quiz button
function disableQuizButton(isGuestVideo) {
    const buttonSelector = isGuestVideo ? ".guest-quiz-button" : "#quiz-button";
    const button = document.querySelector(buttonSelector);
    if (button) {
        button.classList.add("disabled");
        button.classList.remove("enabled");
        button.style.pointerEvents = "none";
        button.style.opacity = "0.5";
    }
}

// Initialize Vimeo players
function initializeVimeoPlayers() {
    console.log("Initializing Vimeo players...");
    $("iframe[data-vimeo-id]").each(function () {
        const iframe = $(this).get(0);
        const videoId = $(this).data("vimeo-id");
        const isGuestVideo = !isUserLoggedIn();

        console.log(`Initializing Vimeo player for video ID: ${videoId}, isGuestVideo: ${isGuestVideo}`);

        if (!totalVideos.has(videoId)) totalVideos.add(videoId);

        const player = new Vimeo.Player(iframe);

        player.on("ended", () => {
            markVideoAsWatched(videoId, isGuestVideo);
        });

        player.on("loaded", () => {
            checkAllVideosWatched(isGuestVideo);
        });
    });
}

// Load the Vimeo Player API dynamically
function loadVimeoAPI(callback) {
    const script = document.createElement("script");
    script.src = "https://player.vimeo.com/api/player.js";
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
    console.log("Vimeo Player API loaded.");
}

// Periodic login state check
setInterval(checkLoginStateAndRefresh, 2000);

// On document ready
document.addEventListener("DOMContentLoaded", () => {
    localStorage.setItem(`currentUserState_${pageKey}`, JSON.stringify(isUserLoggedIn()));
    loadVimeoAPI(initializeVimeoPlayers);
});