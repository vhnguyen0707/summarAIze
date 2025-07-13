import {motion} from "framer-motion";
import CircularProgress from '@mui/material/CircularProgress';
import ReactMarkdown from 'react-markdown'
import {useEffect, useState} from "react";
import {getMistralSummary} from "../scripts/huggingface";
import "../index.css";

const iconUrl = chrome.runtime.getURL("icon-128.png");
// Some of YT's CSS conflicts with tailwind, so we need to override some styles
const sharedStyles = {
    border: "2px solid #000000",
    overflow: "hidden",
    // Force Tailwind styles to take precedence over YouTube's CSS
    display: "flex",
    boxSizing: "border-box" as const,
};
export default function Sidebar({title, transcript, videoId}: {title: string, transcript: string, videoId: string}) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState("");

    useEffect(() => {
        setIsOpen(false);
        setLoading(false);
        setSummary("");
    }, [videoId]);

    const toggleSidebar = async () => {
        setIsOpen(!isOpen);
        setLoading(true);
        try {
            const summaryResult = await getMistralSummary(title, transcript);
            if (!summaryResult) throw new Error("No summary returned from Mistral model");
            setSummary(summaryResult);
        } catch (e) {
            console.error("Error fetching summary:", e);
            setSummary("Failed to load summary. Please try again later.");
        } finally {
            setLoading(false);
        }
    }
    return (
        <motion.div
            onClick={!isOpen ? toggleSidebar : undefined}
            className={`flex shadow-md text-white bg-gray-800 text-2xl mx-auto mb-4 space-x-8 w-full 
                ${isOpen ? "" : "hover:cursor-pointer hover:bg-gray-600"}
                ${isOpen ? "justify-start items-start" : "justify-center items-center"}`}
            style={sharedStyles}
            initial={{height: 60, borderRadius: "30px"}}
            animate={{
                height: isOpen ? 220 : 60,
                borderRadius: isOpen ? "16px" : "30px",
            }}
            transition={{duration: 0.4, ease: "easeInOut"}}
        >
            {loading ? (
                <div className="flex items-center justify-center w-full h-full">
                    <CircularProgress style={{ color: '#ffffff' }} size={40} />
                </div>
            ) : summary ? (
                <div className="overflow-y-auto h-full w-full">
                    <div className="flex items-center space-x-4 p-4">
                        <img src={iconUrl} className="w-10 h-10 rounded-lg" alt="icon" />
                        <p className="font-semibold text-white">Summary:</p>
                    </div>

                    <div className="markdown-content text-left pr-4 pb-4 pl-12">
                        {/* display summary - React state updated with gpt's summary (or error) */}
                        <ReactMarkdown>{summary}</ReactMarkdown>
                    </div>
                </div>
            ) : (
                // Initial button content before fetching - image and text
                <>
                    <img src={iconUrl} className="w-10 h-10 rounded-lg" alt="icon" />
                    <p className="whitespace-nowrap">{isOpen ? "Loading Summary..." : "Click to get summary"}</p>
                    {!isOpen && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-6 h-6 ml-2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m19.5 8.25-7.5 7.5-7.5-7.5"
                            />
                        </svg>
                    )}
                </>
            )}
        </motion.div>
    );

}