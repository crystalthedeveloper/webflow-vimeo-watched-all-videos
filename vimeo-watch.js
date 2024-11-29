"use strict";

// Generate a unique key for each page based on the URL
const pageKey = window.location.pathname;

// Initialize separate videoWatched objects for guest and logged-in users
let guestVideoWatched = JSON.parse(localStorage.getItem(`guestVideoWatched_${pageKey}`)) || {};
let userVideoWatched = JSON.parse(localStorage.getItem(`userVideoWatched_${pageKey}`)) || {};

let totalVideos = new Set(); // Set to store unique video IDs per page

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

function unhideVideoComplete(videoId, isGuestVideo) {
    console.log(`Attempting to unhide completion elements for video ID: ${videoId}`);
    const iframe = $(`iframe[data-vimeo-id='${videoId}']`);
    if (iframe.length > 0) {
        const chapter = iframe.attr("id");
        console.log(`Found iframe for video ID: ${videoId}, Chapter ID: ${chapter}`);

        if (!chapter) {
            console.warn(`No chapter ID found for video ID: ${videoId}`);
            return;
        }

        const targetClass = isGuestVideo ? `.guest_complete_${chapter}` : `.video_complete_${chapter}`;
        if ($(targetClass).length) {
            $(targetClass).removeClass("hidden");
            console.log(`Unhiding ${isGuestVideo ? "guest" : "user"} completion for Chapter ${chapter}`);

            if (!isGuestVideo) {
                attachTabClickHandlers(chapter);
            }
        } else {
            console.warn(`No matching ${isGuestVideo ? "guest" : "user"} completion element for Chapter: ${chapter}`);
        }
    } else {
        console.warn(`No iframe found for video ID: ${videoId}`);
    }
}

function attachTabClickHandlers(chapter) {
    const tabSelector = `[data-w-tab='Tab ${chapter}']`;
    const watchedLinkSelector = `.watched_link${chapter}`;

    if ($(watchedLinkSelector).length && $(tabSelector).length) {
        $(watchedLinkSelector).off("click").on("click", () => {
            $(tabSelector).click();
            console.log(`Tab ${chapter} clicked via .watched_link${chapter}`);
        });
    } else {
        console.log(`No tab or watched link found for Chapter ${chapter}.`);
    }
}

function checkAllVideosWatched(isGuestVideo) {
    const videoWatched = isGuestVideo ? guestVideoWatched : userVideoWatched;
    const watchedVideos = Object.keys(videoWatched).filter((id) => videoWatched[id]).length;

    console.log(
        `Checking all videos watched for ${isGuestVideo ? "guest" : "user"}. Total videos: ${
            totalVideos.size
        }, Watched videos: ${watchedVideos}`
    );

    if (watchedVideos === totalVideos.size && watchedVideos > 0) {
        console.log(`All videos watched for ${isGuestVideo ? "guest" : "user"}. Enabling quiz button.`);
        enableQuizButton(isGuestVideo);
    } else {
        console.log(`Not all videos are watched for ${isGuestVideo ? "guest" : "user"}. Disabling quiz button.`);
        disableQuizButton(isGuestVideo);
    }
}

function enableQuizButton(isGuestVideo) {
    const buttonSelector = isGuestVideo ? ".guest-quiz-button" : "#quiz-button";
    waitForElement(buttonSelector, (button) => {
        button.removeClass("disabled").addClass("enabled").css({
            "pointer-events": "auto",
            opacity: "1",
        });
        // Force redraw to ensure styles are applied
        button[0].offsetHeight;
        console.log(`Quiz button enabled for ${isGuestVideo ? "guest" : "user"}.`);
    });
}

// Disable the quiz button dynamically
function disableQuizButton(isGuestVideo) {
    if (!isGuestVideo) return; // Apply only to logged-in users

    const buttonSelector = "#quiz-button";
    waitForElement(buttonSelector, (button) => {
        button.addClass("disabled").removeClass("enabled").css({
            "pointer-events": "none",
            opacity: "0.5",
        });
        console.log(`Quiz button disabled for ${isGuestVideo ? "guest" : "user"}.`);
    });
}

// Utility function to wait for an element in the DOM
function waitForElement(selector, callback) {
    const checkElement = () => {
        const element = $(selector);
        if (element.length > 0) {
            callback(element);
        } else {
            console.warn(`Element ${selector} not found. Retrying...`);
            setTimeout(checkElement, 100);
        }
    };
    checkElement();
}

function initializeVimeoPlayers() {
    console.log("Initializing Vimeo players...");
    $("iframe[data-vimeo-id]").each(function () {
        const iframe = $(this).get(0);
        const videoId = $(this).data("vimeo-id");
        const isGuestVideo = $(this).closest(".guestvideo").length > 0;

        console.log(`Initializing Vimeo player for video ID: ${videoId}, isGuestVideo: ${isGuestVideo}`);

        if (!totalVideos.has(videoId)) {
            totalVideos.add(videoId);
        }

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

function loadScript(src, callback) {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
    console.log(`Loading script: ${src}`);
}

// Load Vimeo Player API and initialize players
loadScript("https://player.vimeo.com/api/player.js", initializeVimeoPlayers);
