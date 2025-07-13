
export interface CaptionTrack {
    baseUrl: string;
    language: string;
}

export interface TranscriptItem {
    start: string;
    duration: string;
    text: string;
}

const DEFAULT_INNERTUBE_CLIENT_VERSION = "2.20250710.09.00";

function getVideoTitle(html: string): string {
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (!titleMatch) throw new Error("Title not found");
    return titleMatch[1].replace(" - YouTube", "").replace(/^\(\d+\)\s*/, "").trim();
}

async function getDetailsForInnertube(videoId: string): Promise<{title: string, apiKey: string, clientVersion: string}> {
    try {
        // Fetch the YouTube video page instead of the API since it requires OAuth
        const ytPageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
        if (!ytPageResponse.ok) {
            throw new Error("Failed to fetch YouTube page");
        }

        // read the body of the response as a string
        const html = await ytPageResponse.text();
        const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([a-zA-Z0-9_\-]+)"/);
        if (!apiKeyMatch) {
            throw new Error("No INNERTUBE_API_KEY found in the page");
        }

        const clientVersionMatch = html.match(/"INNERTUBE_CLIENT_VERSION":"([\d.]+)"/);

        return {
            title: getVideoTitle(html),
            apiKey: apiKeyMatch[1],
            clientVersion: clientVersionMatch?.[1] || DEFAULT_INNERTUBE_CLIENT_VERSION,
        }
    } catch (error) {
        console.error("Error fetching Innertube details: ", error);
        throw new Error(`Error fetching Innertube details: ${error.message}`);
    }
}

async function fetchPlayerResponse(videoId: string, apiKey: string, clientVersion: string): Promise<any> {
    const url = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`;
    const body = {
        context: {
            client: {clientName: "WEB", clientVersion},
        },
        videoId,
    };

    const res = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });

    if (!res.ok)  throw new Error("Failed to fetch player response");
    return res.json();
}

function getSortedCaptionTracks(playerResponse: any, language: string): Array<CaptionTrack> {
    const extractedCaptionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!extractedCaptionTracks || !Array.isArray(extractedCaptionTracks)) {
        throw new Error("No captions available for this video");
    }

    const captionTracks = extractedCaptionTracks.map((item: any) => ({
        baseUrl: decodeURIComponent(item.baseUrl.replace(/\\u0026/g, "&")),
        language: item.name.simpleText,
    }));

    const desiredLanguage = language.toLowerCase();
    captionTracks.sort((a, b) => {
        const aLang = a.language.toLowerCase();
        const bLang = b.language.toLowerCase();
        if (aLang === desiredLanguage && bLang !== desiredLanguage || aLang.includes(desiredLanguage) && !bLang.includes(desiredLanguage)) {
            return -1;
        } else if (bLang === desiredLanguage && aLang !== desiredLanguage || bLang.includes(desiredLanguage) && !aLang.includes(desiredLanguage)) {
            return 1;
        }
        return 0;
    });
    return captionTracks;
}

function sortCaptionsByLanguage(captionTracks: Array<CaptionTrack>, language: string): Array<CaptionTrack> {
    const desiredLanguage = language.toLowerCase();
    captionTracks.sort((a, b) => {
        const aLang = a.language.toLowerCase();
        const bLang = b.language.toLowerCase();
        if (aLang === desiredLanguage && bLang !== desiredLanguage || aLang.includes(desiredLanguage) && !bLang.includes(desiredLanguage)) {
            return -1; // a comes first
        } else if (bLang === desiredLanguage && aLang !== desiredLanguage || bLang.includes(desiredLanguage) && !aLang.includes(desiredLanguage)) {
            return 1; // b comes first
        }
        return 0;
    })
    return captionTracks;
}

async function getXMLTranscript(baseUrl: string): Promise<Array<TranscriptItem>> {
    try {
        const response = await fetch(baseUrl);
        if (!response.ok) throw new Error("Failed to fetch XML transcript");

        const transcriptPageXML = await response.text();

        // Parse the XML stringto prepare for extracting text and timestamps
        const parser = new DOMParser();
        // Converts raw XML string into DOM like XMLDocument object
        const xmlDoc = parser.parseFromString(transcriptPageXML, "text/xml");
        //E.g. <?xml version="1.0" encoding="utf-8" ?><transcript><text start="0.24" dur="3.12">This video is brought to you by...</text><text start="3.36" dur="4.4">
        // Get all the <text> elements - HTML collection of the tags we want
        const textNodes = xmlDoc.getElementsByTagName("text");

        return Array.from(textNodes).map((node: Element) => ({
            start: convertSecondsToMinutes(node.getAttribute("start") || "0"),
            duration: convertSecondsToMinutes(node.getAttribute("dur") || "0"),
            text: node.textContent?.replace(/\n/g, "") || ""
        }));
    } catch (error) {
        console.error("Error fetching XML transcript: ", error);
        throw new Error(`Failed to fetch transcript: ${error.message}`);
    }
}

function convertSecondsToMinutes(seconds: string): string {
    const totalSeconds = parseFloat(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function convertTranscriptArrToString(transcript: Array<TranscriptItem>): string {
    return transcript.map(item => `Start: ${item.start}, Duration: ${item.duration}, Text: ${item.text}`).join("\n");
}

export async function getYouTubeTitleAndTranscript(videoId: string): Promise<{title: string, transcript: string} | null> {
    try {
        const {title, apiKey, clientVersion} = await getDetailsForInnertube(videoId);
        const playerResponse = await fetchPlayerResponse(videoId, apiKey, clientVersion);
        const captionTracks = getSortedCaptionTracks(playerResponse, "English");
        if (captionTracks.length === 0) {
            throw new Error("No English captions found for this video");
        }
        const transcript = await getXMLTranscript(captionTracks[0].baseUrl);
        console.log("Transcript fetched successfully:", transcript);
        return {title, transcript: convertTranscriptArrToString(transcript)};
    } catch (error) {
        console.error("Error getting YouTube transcript: ", error);
        return null; // Return null if any error occurs
    }
}

export async function getYouTubeTitleAndAvailableLanguages(videoId: string): Promise<{title: string, languages: Array<{language: string, baseUrl: string}>} | null> {
    try {
        const {title, apiKey, clientVersion} = await getDetailsForInnertube(videoId);
        const playerResponse = await fetchPlayerResponse(videoId, apiKey, clientVersion);
        const captionTracks = getSortedCaptionTracks(playerResponse, "English");
        
        const languages = captionTracks.map(track => ({
            language: track.language,
            baseUrl: track.baseUrl
        }));
        
        return {title, languages};
    } catch (error) {
        console.error("Error getting YouTube languages: ", error);
        return null;
    }
}

export async function getTranscriptForLanguage(baseUrl: string): Promise<string | null> {
    try {
        const transcript = await getXMLTranscript(baseUrl);
        return convertTranscriptArrToString(transcript);
    } catch (error) {
        console.error("Error getting transcript for language: ", error);
        return null;
    }
}