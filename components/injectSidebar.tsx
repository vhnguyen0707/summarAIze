import {createRoot, Root} from "react-dom/client";
import Sidebar from "./Sidebar";

let summaryRoot: Root;
export async function injectSidebar(title: string, transcript: string, videoId: string, element: HTMLElement) {
    let summaryDiv = document.getElementById("yt-ai-summary-sidebar");
    if (!summaryDiv) {
        summaryDiv = document.createElement("div");
        summaryDiv.id  = "yt-ai-summary-sidebar";
        element.appendChild(summaryDiv);
    }

    if (!summaryRoot) {
        // createRoot allows creating a root which acts as the entry point for the React application
        summaryRoot = createRoot(summaryDiv);
    }

    summaryRoot.render(<Sidebar title={title} transcript={transcript} videoId={videoId} />);
}