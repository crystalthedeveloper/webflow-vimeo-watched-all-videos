"use strict";

// Generate a unique key for each page based on the URL
const pageKey = window.location.pathname;

// Initialize separate videoWatched objects for guest and logged-in users
let guestVideoWatched = JSON.parse(localStorage.getItem(`guestVideoWatched_${pageKey}`)) || {};
let userVideoWatched = JSON.parse(localStorage.getItem(`userVideoWatched_${pageKey}`)) || {};

let totalVideos = new Set(); // Set to store unique video IDs per page

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
        console.log("Disabled the quiz button.");
    } else {
        console.warn("Quiz button not found on the page.");
    }
}

// Enable the quiz button only if all videos are watched
function enableQuizButtonIfAllWatched() {
    const totalWatched = isGuest()
        ? Object.keys(guestVideoWatched).filter((id) => guestVideoWatched[id]).length
        : Object.keys(userVideoWatched).filter((id) => userVideoWatched[id]).length;

    if (totalWatched === totalVideos.size && totalVideos.size > 0) {
        const button = document.querySelector(".quiz-button");
        if (button) {
            button.classList.remove("disabled");
            button.style.pointerEvents = "auto";
            button.style.opacity = "1";
            console.log("Enabled the quiz button.");
        } else {
            console.warn("Quiz button not found on the page.");
        }
    } else {
        console.log(`Not all videos watched. Total: ${totalVideos.size}, Watched: ${totalWatched}`);
    }
}

// Attach click handlers for watched links dynamically
function attachWatchedLinkHandlers() {
    if (isGuest()) return; // Guests do not have watched links

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

        // Remove existing click handler to avoid duplication
        watchedLink.removeEventListener("click", handleWatchedLinkClick);
        watchedLink.addEventListener("click", handleWatchedLinkClick);

        function handleWatchedLinkClick(event) {
            event.preventDefault(); // Prevent default behavior
            targetTab.click(); // Simulate clicking the tab
            console.log(`Navigated to ${targetTabSelector} via ${linkSelector}.`);
        }
    });
}

// Unhide completion elements dynamically for both guests and logged-in users
function unhideVideoComplete(videoId, chapter) {
    console.log(`Attempting to unhide completion elements for video ID: ${videoId}, Chapter: ${chapter}`);

    if (isGuest()) {
        // Handle guest user completion elements
        const guestCompletionClass = `.guest_complete_${chapter}`;
        const guestCompletionElements = document.querySelectorAll(guestCompletionClass);

        if (guestCompletionElements.length > 0) {
            guestCompletionElements.forEach((element) => element.classList.remove("hidden"));
            console.log(`Unhid guest completion elements for Chapter ${chapter}.`);
        } else {
            console.warn(`No guest completion elements found for Chapter ${chapter}.`);
        }
    } else {
        // Handle logged-in user completion elements
        const userCompletionClass = `.video_complete_${chapter}`;
        const userCompletionElements = document.querySelectorAll(userCompletionClass);

        if (userCompletionElements.length > 0) {
            userCompletionElements.forEach((element) => element.classList.remove("hidden"));
            console.log(`Unhid logged-in user completion elements for Chapter ${chapter}.`);

            // Attach handlers for links within the newly unhidden elements
            attachWatchedLinkHandlers();
        } else {
            console.warn(`No logged-in user completion elements found for Chapter ${chapter}.`);
        }
    }

    // Check if all videos are watched to enable the quiz button
    enableQuizButtonIfAllWatched();
}

// Initialize Vimeo players dynamically
function initializeVimeoPlayers() {
    console.log("Initializing Vimeo players...");
    document.querySelectorAll("iframe[data-vimeo-id]").forEach((iframe) => {
        const videoId = iframe.getAttribute("data-vimeo-id");
        const chapter = parseInt(iframe.closest("[id^='Chapter']").id.replace("Chapter ", ""), 10);

        console.log(`Initializing Vimeo player for video ID: ${videoId}, Chapter: ${chapter}`);
        if (!totalVideos.has(videoId)) totalVideos.add(videoId);

        const player = new Vimeo.Player(iframe);

        player.on("ended", () => {
            console.log(`Video ${videoId} ended.`);

            // Mark video as watched
            if (isGuest()) {
                guestVideoWatched[videoId] = true;
                localStorage.setItem(
                    `guestVideoWatched_${pageKey}`,
                    JSON.stringify(guestVideoWatched)
                );
            } else {
                userVideoWatched[videoId] = true;
                localStorage.setItem(
                    `userVideoWatched_${pageKey}`,
                    JSON.stringify(userVideoWatched)
                );
            }

            unhideVideoComplete(videoId, chapter);
        });

        player.on("loaded", () => {
            console.log(`Video ${videoId} loaded successfully.`);
        });
    });
}

// DOM Content Loaded handler
document.addEventListener("DOMContentLoaded", () => {
    disableQuizButton(); // Disable the quiz button initially
    loadScript("https://player.vimeo.com/api/player.js", () => {
        initializeVimeoPlayers();
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