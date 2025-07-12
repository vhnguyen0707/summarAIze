
export interface CaptionTrack {
    baseUrl: string;
    language: string;
}

export interface TranscriptItem {
    start: string;
    duration: string;
    text: string;
}

function getVideoTitle(html: string): string {
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (!titleMatch) throw new Error("Title not found");
    return titleMatch[1].replace(" - YouTube", "").replace(/^\(\d+\)\s*/, "").trim();
}

async function getCaptionTracks(videoId: string): Promise<{title: string, captionTracks: Array<CaptionTrack>}> {
    try {
        // Fetch the YouTube video page instead of the API since it requires OAuth
        const ytPageResponse = await fetch(`http://www.youtube.com/watch?v=${videoId}`);
        if (!ytPageResponse.ok) {
            throw new Error("Failed to fetch YouTube page");
        }

        // read the body of the response as a string
        const ytPageHtml = await ytPageResponse.text();

        // splits the page into array at each occurence of '"captions":'
        // const splitPage = ytPageHtml.split('"captions":');

        // Use regex to match the ytInitialPlayerResponse JSON
        const initialPlayerResponseMatch = ytPageHtml.match(/ytInitialPlayerResponse\s*=\s*({.*?});/); // JSON is captured in the first group
        if (!initialPlayerResponseMatch) {
            throw new Error("No captions available for this video");
        }

        const playerResponse = JSON.parse(initialPlayerResponseMatch[1]);
        const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!captions || !Array.isArray(captions)) {
            throw new Error("No captions available for this video");
        }

        // Example of caption tracks object:
        // { 'playerCaptionsTracklistRenderer':
        //      'audioTracks': [{…}],
        //      'captionTracks': [
        //          {
        //              'baseUrl': 'https://www.youtube.com/api/timedtext?v=BwuKOONwoin3',
        //              `'name': {
        //                  'simpleText': 'English'
        //               },
        //               'isTranslatable': true,
        //          }
        //      ]
        //      'translationLanguages': [{…}, {…}, {…}]
        // }

        const captionTracks = captions.map((item: any) => ({
            baseUrl: item.baseUrl.replace(/\\u0026/g, "&"), // Replace escaped ampersands
            language: item.name.simpleText,
        }));
        return {
            title: getVideoTitle(ytPageHtml),
            captionTracks: captionTracks
        }
    } catch (error) {
        console.error("Error fetching caption tracks: ", error);
        throw new Error(`No captions available: ${error.message}`);
    }
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
        if (!response.ok) {
            throw new Error("Failed to fetch XML transcript");
        }
        const transcriptPageXML = await response.text();


        // Parse the XML stringto prepare for extracting text and timestamps
        const parser = new DOMParser();
        // Converts raw XML string into DOM like XMLDocument object
        const xmlDoc = parser.parseFromString(transcriptPageXML, "text/xml");
        // Get all the <text> elements - HTML collection of the tags we want
        const textNodes = xmlDoc.getElementsByTagName("text");

        //E.g. <?xml version="1.0" encoding="utf-8" ?><transcript><text start="0.24" dur="3.12">This video is brought to you by...</text><text start="3.36" dur="4.4">
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

function convertTransciptArrToString(transcript: Array<TranscriptItem>): string {
    return transcript.map(item => `Start: ${item.start}, Duration: ${item.duration}, Text: ${item.text}`).join("\n");
}

export async function getYouTubeTitleAndTranscript(videoId: string): Promise<{title: string, transcript: string | null} | null> {
    try {
        const {title, captionTracks} = await getCaptionTracks(videoId);
        const sortedTracks = sortCaptionsByLanguage(captionTracks, "English");
        const transcript = await getXMLTranscript(sortedTracks[0].baseUrl);
        return {title, transcript: convertTransciptArrToString(transcript)};
    } catch (error) {
        console.error("Error getting YouTube transcript: ", error);
        return null; // Return null if any error occurs
    }
}