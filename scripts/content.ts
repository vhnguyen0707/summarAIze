

function isYoutubeVideoPage() {
    // Check if the current page is a YouTube video page
    return window.location.hostname === "www.youtube.com" && window.location.pathname.startsWith("/watch");
}

function getVideoIdFromUrl() {
    // Extract the video ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("v"); // "v" is the query parameter that holds the video ID in YouTube URLs
}

function waitForElement(elementId, timeoutMS = 5000) {
    // check if element is already present
    const element = document.getElementById(elementId);
    if (element) return element;

    return new Promise((resolve, reject) => {
        // Node that will be used to observe the DOM for changes
        const targetNode = document.body;
        // Options for the observer (which mutations to observe)
        const config = { childList: true, subtree: true };
        // Set a timeout to reject the promise if the element is not found within the specified time
        const timeoutId = setTimeout(() => reject("Element not found within timeout"), timeoutMS);
        // Callback function execute when mutations are observed
        const callback = (_, observer) => {
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
function handleVideoChange() {

}
function observeForVideoChanges() {}