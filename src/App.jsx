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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-8">
        <div className="mb-7">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                UX Feedback <span className="text-indigo-500">Assistant</span>
              </h1>
              <div className="max-w-7xl">
                <p className="text-sm text-gray-500 mt-1">
                  Describe your design or upload a file — get structured, expert
                  UX feedback instantly.
                </p>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-2">
                    Feedback generated is sourced from established UX
                    frameworks:
                  </p>
                  <ul className="flex flex-col gap-1">
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="text-indigo-400">→</span>
                      <strong>Nielsen's 10 Usability Heuristics</strong>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="text-indigo-400">→</span>
                      <strong>The 21 Laws of UX</strong>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="text-indigo-400">→</span>
                      <strong>WCAG 2.1 Accessibility Standards</strong>
                    </li>
                  </ul>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  (Every insight is traceable to a trusted source)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-5 items-start">
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
