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

// Attach handler for .watched_link1
function attachWatchedLink1Handler() {
    const linkSelector = ".watched_link1";
    const targetTabSelector = "[data-w-tab='Tab 1']";
    attachWatchedLinkHandler(linkSelector, targetTabSelector);
}

// Attach handler for .watched_link2
function attachWatchedLink2Handler() {
    const linkSelector = ".watched_link2";
    const targetTabSelector = "[data-w-tab='Tab 2']";
    attachWatchedLinkHandler(linkSelector, targetTabSelector);
}

// Generic handler for attaching watched links
function attachWatchedLinkHandler(linkSelector, targetTabSelector) {
    const watchedLink = document.querySelector(linkSelector);
    const targetTabLink = document.querySelector(targetTabSelector);

    console.log(`Checking for ${linkSelector} and ${targetTabSelector}...`);
    if (!watchedLink) {
        console.warn(`Watched link ${linkSelector} not found.`);
        return;
    }
    if (!targetTabLink) {
        console.warn(`Target tab ${targetTabSelector} not found.`);
        return;
    }

    console.log(`Attaching click handler to ${linkSelector} for ${targetTabSelector}.`);
    watchedLink.removeEventListener("click", handleWatchedLinkClick);
    watchedLink.addEventListener("click", (event) => {
        event.preventDefault();
        console.log(`Click handler fired for ${linkSelector}`);
        activateTab(targetTabLink, targetTabSelector);
    });
}

// Activate tab with fallback
function activateTab(targetTabLink, targetTabSelector) {
    try {
        console.log(`Simulating click on ${targetTabSelector}...`);
        targetTabLink.click();
        console.log(`Simulated click on ${targetTabSelector}.`);
    } catch (error) {
        console.warn(`Error simulating click on ${targetTabSelector}:`, error);

        const tabsContainer = targetTabLink.closest(".w-tabs");
        if (tabsContainer) {
            console.log(`Manually activating tab ${targetTabSelector}...`);

            const allTabs = tabsContainer.querySelectorAll("[data-w-tab]");
            const allTabLinks = tabsContainer.querySelectorAll(".w-tab-link");

            allTabs.forEach((tab) => {
                tab.classList.remove("w--tab-active");
                tab.setAttribute("aria-selected", "false");
            });

            allTabLinks.forEach((link) => {
                link.classList.remove("w--current");
            });

            targetTabLink.classList.add("w--current");
            targetTabLink.setAttribute("aria-selected", "true");

            const targetTabContent = tabsContainer.querySelector(
                `[aria-controls="${targetTabLink.id}"]`
            );
            if (targetTabContent) {
                targetTabContent.classList.add("w--tab-active");
            } else {
                console.warn(
                    `No tab content found for ${targetTabSelector} with aria-controls="${targetTabLink.id}".`
                );
            }

            console.log(`Activated tab link for ${targetTabSelector}.`);
        } else {
            console.warn(`Could not find tabs container for ${targetTabSelector}.`);
        }
    }
}

function attachWatchedLinkHandlers() {
    console.log("Attaching watched link handlers...");
    attachWatchedLink1Handler();
    attachWatchedLink2Handler();
}

// Unhide completion elements dynamically
function unhideVideoComplete(videoId, chapter) {
    console.log(`Attempting to unhide completion elements for video ID: ${videoId}, Chapter: ${chapter}`);

    if (isGuest()) {
        const guestCompletionClass = `.guest_complete_${chapter}`;
        const guestCompletionElements = document.querySelectorAll(guestCompletionClass);

        if (guestCompletionElements.length > 0) {
            guestCompletionElements.forEach((element) => element.classList.remove("hidden"));
            console.log(`Unhid guest completion elements for Chapter ${chapter}.`);
        } else {
            console.warn(`No guest completion elements found for Chapter ${chapter}.`);
        }
    } else {
        const userCompletionClass = `.video_complete_${chapter}`;
        const userCompletionElements = document.querySelectorAll(userCompletionClass);

        if (userCompletionElements.length > 0) {
            userCompletionElements.forEach((element) => element.classList.remove("hidden"));
            console.log(`Unhid logged-in user completion elements for Chapter ${chapter}.`);
            attachWatchedLinkHandlers();
        } else {
            console.warn(`No logged-in user completion elements found for Chapter ${chapter}.`);
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

function loadScript(src, callback) {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
    console.log(`Loading script: ${src}`);
}