import {getYouTubeTitleAndTranscript} from "./transcript-service";
import {injectSidebar} from "../components/injectSidebar";

function isYoutubeVideoPage() {
    // Check if the current page is a YouTube video page
    return window.location.hostname === "www.youtube.com" && window.location.pathname.startsWith("/watch");
}

function getVideoIdFromUrl() {
    // Extract the video ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("v"); // "v" is the query parameter that holds the video ID in YouTube URLs
}

function waitForElement(elementId: string, timeoutMS = 5000): Promise<HTMLElement | null> {
    // check if element is already present
    const element = document.getElementById(elementId);
    if (element) return Promise.resolve(element);

    return new Promise((resolve, reject) => {
        // Node that will be used to observe the DOM for changes
        const targetNode = document.body;
        // Options for the observer (which mutations to observe)
        const config = { childList: true, subtree: true };
        // Set a timeout to reject the promise if the element is not found within the specified time
        const timeoutId = setTimeout(() => reject("Element not found within timeout"), timeoutMS);
        // Callback function execute when mutations are observed
        const callback = (_: MutationRecord[], observer: MutationObserver) => {
            // Stop observing once the element is found
            const element = document.getElementById(elementId);
            if (element) {
                observer.disconnect();
                clearTimeout(timeoutId);
                resolve(element);
            }
        }
        // Create an instance of MutationObserver and pass the callback function
        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    })
}

let previousVideoId: string | null = null;
async function handleVideoChange() {
    try {
        if (!isYoutubeVideoPage()) {
            return;
        }
        /**
         * Only process if the video ID is valid and different from the last processed video ID
         * YouTube can dynamically load a new video without performing a full page reload due to the SPA nature.
         * So we manually check if the video ID has changed to ensure that the script processes only new videos.
         * This prevents re-injecting the sidebar or re-fetching captions for the same video.
         */
        const videoId = getVideoIdFromUrl();
        if (!videoId || videoId === previousVideoId) return;
        previousVideoId = videoId;
        const videoDetails = await getYouTubeTitleAndTranscript(videoId);
        if (videoDetails) {
            const element = await waitForElement("secondary");
            if (element) {
                console.log("Injecting summary sidebar for video...");
                injectSidebar(videoDetails.title, videoDetails.transcript, videoId, element);
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }

}
function observeForVideoChanges() {
    const targetNode = document.body;
    const config = { childList: true, subtree: true }; // Observe changes in DOM's child nodes and entire subtree
    const observer = new MutationObserver(handleVideoChange);
    observer.observe(targetNode, config);
}

observeForVideoChanges();