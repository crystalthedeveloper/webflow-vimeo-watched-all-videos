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

// Unhide completion elements dynamically and attach appropriate handlers
function unhideVideoComplete(videoId, chapter) {
    console.log(`Attempting to unhide completion elements for video ID: ${videoId}, Chapter: ${chapter}`);

    if (isGuest()) {
        switch (chapter) {
            case 1:
                $(".guest_complete_1").removeClass("hidden");
                break;
            case 2:
                $(".guest_complete_2").removeClass("hidden");
                break;
            case 3:
                $(".guest_complete_3").removeClass("hidden");
                break;
        }
    } else {
        switch (chapter) {
            case 1:
                $(".video_complete_1").removeClass("hidden");
                $(".watched_link1").off("click").on("click", () => $('[data-w-tab="Tab 1"]').click());
                break;
            case 2:
                $(".video_complete_2").removeClass("hidden");
                $(".watched_link2").off("click").on("click", () => $('[data-w-tab="Tab 2"]').click());
                break;
            case 3:
                $(".video_complete_3").removeClass("hidden");
                break;
        }
    }

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
    disableQuizButton();
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