import {createRoot} from "react-dom/client";
import "../index.css";

function Popup() {
    return (
        <div className="w-80 min-h-96 max-h-[600px] bg-gradient-to-br from-blue-50 to-indigo-100 p-4 overflow-auto font-sans">
            <div className="flex items-center gap-3 mb-6">
                <img 
                    src={chrome.runtime.getURL("icon-128.png")} 
                    alt="SummarAIze" 
                    className="w-12 h-12 rounded-lg shadow-md"
                />
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 m-0">SummarAIze</h1>
                    <p className="text-sm text-gray-600 m-0">AI-Powered YouTube Summaries</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">How it works</h2>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Navigate to any YouTube video and watch as SummarAIze automatically generates 
                        intelligent summaries using advanced AI technology.
                    </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Features</h2>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Instant video summaries
                        </li>
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Smart transcript analysis
                        </li>
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Seamless YouTube integration
                        </li>
                    </ul>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
                    <p className="text-sm text-blue-800">
                        ✨ Ready to enhance your YouTube experience!
                    </p>
                </div>
            </div>
        </div>
    );
}

createRoot(document.getElementById("root") as HTMLElement).render(<Popup />);