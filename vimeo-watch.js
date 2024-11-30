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

    // Attach click handler to the watched link for navigation
    attachWatchedLinkClickHandler(chapter);
}

// Attach click handlers for watched links to navigate to their respective tabs
function waitForTab1AndAttachWatchedLink2() {
    // Select the Tab 1 and Tab 2 elements
    const tab1Element = document.querySelector("[data-w-tab='Tab 1']");
    const tab2Element = document.querySelector("[data-w-tab='Tab 2']");
    const watchedLink2 = document.querySelector(".watched_link2");

    if (!tab1Element || !tab2Element || !watchedLink2) {
        console.warn("Required elements for Tab 1, Tab 2, or watched_link2 not found.");
        return;
    }

    // Monitor when Tab 1 becomes the active tab
    const observer = new MutationObserver(() => {
        if (tab1Element.classList.contains("w--current")) {
            console.log("Tab 1 is now active. Attaching watched_link2 handler.");

            // Ensure only one click handler is attached
            watchedLink2.removeEventListener("click", handleWatchedLinkClick);
            watchedLink2.addEventListener("click", handleWatchedLinkClick);

            // Stop observing since the handler is attached
            observer.disconnect();
        }
    });

    // Observe changes to Tab 1's class attribute
    observer.observe(tab1Element, { attributes: true, attributeFilter: ["class"] });

    // Define the handler for watched_link2 click
    function handleWatchedLinkClick(event) {
        event.preventDefault(); // Prevent default link behavior
        tab2Element.click(); // Simulate clicking on Tab 2
        console.log("Navigated to Tab 2 via watched_link2.");
    }
}

// Call the function on document ready
document.addEventListener("DOMContentLoaded", () => {
    waitForTab1AndAttachWatchedLink2();
});

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