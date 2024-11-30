"use strict";

// Generate a unique key for each page based on the URL
const pageKey = window.location.pathname;

// Initialize separate videoWatched objects for guest and logged-in users
let guestVideoWatched = JSON.parse(localStorage.getItem(`guestVideoWatched_${pageKey}`)) || {};
let userVideoWatched = JSON.parse(localStorage.getItem(`userVideoWatched_${pageKey}`)) || {};

let totalVideos = new Set(); // Set to store unique video IDs per page

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

// Attach click handlers for watched links dynamically
function attachWatchedLinkHandlers() {
    // Define mappings between watched links and target tabs
    const linksToTabs = {
        ".watched_link1": "[data-w-tab='Tab 1']", // .watched_link1 navigates to Tab 1
        ".watched_link2": "[data-w-tab='Tab 2']", // .watched_link2 navigates to Tab 2
    };

    Object.keys(linksToTabs).forEach((linkSelector) => {
        const targetTabSelector = linksToTabs[linkSelector];
        const watchedLink = document.querySelector(linkSelector);
        const targetTab = document.querySelector(targetTabSelector);

        if (!watchedLink || !targetTab) {
            console.warn(`Missing ${linkSelector} or ${targetTabSelector}.`);
            return;
        }

        // Attach click handler
        watchedLink.removeEventListener("click", handleWatchedLinkClick);
        watchedLink.addEventListener("click", handleWatchedLinkClick);

        function handleWatchedLinkClick(event) {
            event.preventDefault(); // Prevent default behavior
            targetTab.click(); // Simulate clicking the tab
            console.log(`Navigated to ${targetTabSelector} via ${linkSelector}.`);
        }
    });
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
            enableQuizButtonForChapter(chapter);
        });

        player.on("loaded", () => {
            console.log(`Video ${videoId} loaded successfully.`);
        });
    });
}

// DOM Content Loaded handler
document.addEventListener("DOMContentLoaded", () => {
    disableAllQuizButtons(); // Disable all quiz buttons initially
    loadScript("https://player.vimeo.com/api/player.js", () => {
        initializeVimeoPlayers();
        attachWatchedLinkHandlers(); // Attach handlers for watched links
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