import { useState, useRef } from "react";
import Navbar from "./components/layouts/Navbar";
import InputPanel from "./components/layouts/InputPanel";
import ResultsPanel from "./components/layouts/ResultsPanel";
import { useAnalyze } from "./hooks/useAnalyze";

function App() {
  const [appState, setAppState] = useState("input");
  const [activeTab, setActiveTab] = useState("text");
  const [activeFilter, setActiveFilter] = useState("all");
  const [contextOpen, setContextOpen] = useState(false);
  const [checkedToggles, setCheckedToggles] = useState(["usability"]);
  const [description, setDescription] = useState("");
  const [feedbackData, setFeedbackData] = useState(null);
  const resultsPanelRef = useRef(null);

  const { analyze } = useAnalyze();

  const handleSubmit = async () => {
    if (!description.trim()) return;

    setAppState("loading");
    setFeedbackData(null);
    setTimeout(() => {
      resultsPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    const context = {
      featureTitle:
        document.querySelector('[placeholder="e.g. Onboarding flow redesign"]')
          ?.value || "",
      industry:
        document.querySelector(
          '[placeholder="e.g. HealthTech, FinTech, E-commerce"]',
        )?.value || "",
      featureBeingDesigned:
        document.querySelector(
          '[placeholder="e.g. Checkout page, Sign-up form"]',
        )?.value || "",
      targetAudience:
        document.querySelector(
          '[placeholder="e.g. First-time users, Enterprise teams"]',
        )?.value || "",
    };

    const result = await analyze({
      description,
      focusAreas: checkedToggles,
      context,
    });

    if (result) {
      setFeedbackData(result);
      setAppState("results");
    } else {
      setAppState("input");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-12 py-8">
        <div className="mb-7">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                UX Feedback <span className="text-indigo-500">Assistant</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Describe your design or upload a file — get structured, expert
                UX feedback instantly.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Claude AI · Online
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[480px_1fr] gap-5 items-start">
          <InputPanel
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            contextOpen={contextOpen}
            setContextOpen={setContextOpen}
            checkedToggles={checkedToggles}
            setCheckedToggles={setCheckedToggles}
            description={description}
            setDescription={setDescription}
            onSubmit={handleSubmit}
            appState={appState}
          />
          <div ref={resultsPanelRef}>
            <ResultsPanel
              appState={appState}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              feedbackData={feedbackData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
