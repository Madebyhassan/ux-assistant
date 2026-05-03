import InputTabs from "../ui/InputTabs";
import ContextAccordion from "../ui/ContextAccordion";
import FocusToggles from "../ui/FocusToggles";

function InputPanel({
  activeTab,
  setActiveTab,
  contextOpen,
  setContextOpen,
  checkedToggles,
  setCheckedToggles,
  description,
  setDescription,
  onSubmit,
  appState,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm sticky top-20">
      {/* Header */}
      <div className="px-6 pt-5 pb-0">
        <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
          Input Method
        </p>
        <InputTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Body */}
      <div className="px-6 py-5 flex flex-col gap-4">
        {/* Description field — always visible */}
        <div>
          <label className="block text-xs font-semibold text-gray-900 mb-1.5">
            Description
          </label>
          <textarea
            className="w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 resize-none min-h-28 leading-relaxed outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-gray-300"
            maxLength={2000}
            placeholder="Describe your design, user flow, or UI problem in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="text-right text-xs text-gray-300 mt-1">
            {description.length} / 2000 characters
          </p>
        </div>

        {/* Upload zone — only when upload tab active */}
        {activeTab === "upload" && (
          <div className="border-[1.5px] border-dashed border-gray-400 rounded-xl p-7 text-center bg-gray-50 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
            <div className="text-3xl mb-2.5 opacity-50">☁️</div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              <span className="text-indigo-500 font-semibold">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-gray-300">PNG, JPG, PDF · Max 10MB</p>
          </div>
        )}

        {/* URL input — only when url tab active */}
        {activeTab === "url" && (
          <div className="flex items-center border-[1.5px] border-gray-200 rounded-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
            <span className="px-3 py-2.5 bg-gray-50 border-r border-gray-200 text-xs text-gray-500 font-mono">
              https://
            </span>
            <input
              type="text"
              placeholder="your-design.figma.com or live URL"
              className="flex-1 px-3 py-2.5 text-sm font-mono text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
            />
          </div>
        )}

        {/* Context accordion */}
        <ContextAccordion
          contextOpen={contextOpen}
          setContextOpen={setContextOpen}
        />

        {/* Focus toggles */}
        <FocusToggles
          checkedToggles={checkedToggles}
          setCheckedToggles={setCheckedToggles}
        />

        {/* Submit button */}
        <button
          onClick={onSubmit}
          disabled={appState === "loading"}
          className="w-full py-3.5 bg-indigo-500 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          {appState === "loading" ? "Analysing..." : "Analyse Design →"}
        </button>
      </div>
    </div>
  );
}

export default InputPanel;
