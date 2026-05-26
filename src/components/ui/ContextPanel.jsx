import { useState } from "react";

const industryOptions = [
  { value: "", label: "Select industry..." },
  { value: "SaaS / Productivity", label: "SaaS / Productivity" },
  { value: "FinTech / Finance", label: "FinTech / Finance" },
  { value: "HealthTech / Medical", label: "HealthTech / Medical" },
  { value: "E-commerce / Retail", label: "E-commerce / Retail" },
  { value: "EdTech / Education", label: "EdTech / Education" },
  { value: "Gaming / Entertainment", label: "Gaming / Entertainment" },
  { value: "Portfolio / Creative", label: "Portfolio / Creative" },
  { value: "Enterprise B2B", label: "Enterprise B2B" },
  { value: "Government / Public", label: "Government / Public" },
  { value: "Travel / Hospitality", label: "Travel / Hospitality" },
  { value: "Other", label: "Other" },
];

const audienceOptions = [
  "Hiring Managers",
  "Business Professionals",
  "Founders / CEOs",
  "Investors",
  "Developers",
  "Designers / Creatives",
  "Domain Experts / Specialists",
  "Enterprise / Executive",
  "General Public",
  "Content Creators / Influencers",
];

const featureOptions = [
  { value: "", label: "Select feature or page type..." },
  { value: "Marketing / Landing Page", label: "Marketing / Landing Page" },
  { value: "Product Application", label: "Product Application" },
  { value: "Dashboard / Data", label: "Dashboard / Data" },
  { value: "E-commerce / Shop", label: "E-commerce / Shop" },
  { value: "Portfolio / Showcase", label: "Portfolio / Showcase" },
  { value: "Onboarding Flow", label: "Onboarding Flow" },
  { value: "Form / Sign-up", label: "Form / Sign-up" },
  { value: "Navigation / Menu", label: "Navigation / Menu" },
  { value: "Blog / Content", label: "Blog / Content" },
  { value: "Component / UI Element", label: "Component / UI Element" },
  { value: "Other", label: "Other" },
];

function ContextPanel({ contextData, setContextData }) {
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [industryOpen, setIndustryOpen] = useState(false);
  const [featureOpen, setFeatureOpen] = useState(false);
  const update = (field, value) => {
    setContextData((prev) => ({ ...prev, [field]: value }));
  };

  const allSelected =
    contextData.industry &&
    contextData.targetAudience.length > 0 &&
    contextData.featureBeingDesigned;

  return (
    <div className="flex flex-col gap-3">
      {/* Header + instruction */}
      <div>
        <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">
          Analysis Context
        </p>
        <p
          className={`text-xs leading-relaxed ${allSelected ? "text-green-600" : "text-indigo-500"}`}
        >
          {allSelected
            ? "✓ Context complete — analysis will be highly accurate"
            : "→ Select all three fields below for the most accurate results"}
        </p>
      </div>

      {/* Industry */}
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
          Industry
        </label>
        <button
          onClick={() => setIndustryOpen(!industryOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 border-[1.5px] rounded-xl text-sm transition-all
      ${
        contextData.industry
          ? "border-indigo-500 bg-indigo-50 text-indigo-900"
          : "border-gray-200 bg-white text-gray-400 hover:border-indigo-300"
      }`}
        >
          <span>{contextData.industry || "Select industry..."}</span>
          <span
            className={`text-base transition-transform duration-200 ${industryOpen ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>
        {industryOpen && (
          <div className="mt-1.5 border border-gray-200 rounded-xl overflow-hidden">
            {industryOptions
              .filter((opt) => opt.value !== "")
              .map((opt, i) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    update("industry", opt.value);
                    setIndustryOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-left w-full text-sm transition-all
            ${i < industryOptions.length - 2 ? "border-b border-gray-100" : ""}
            ${contextData.industry === opt.value ? "bg-indigo-50 text-indigo-900" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  <div
                    className={`w-4 h-4 rounded border-[1.5px] shrink-0 flex items-center justify-center text-[10px] transition-all
            ${contextData.industry === opt.value ? "bg-indigo-500 border-indigo-500 text-white" : "border-gray-300"}`}
                  >
                    {contextData.industry === opt.value && "✓"}
                  </div>
                  {opt.label}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Target audience — multi-select checkboxes */}
      {/* Target audience — collapsible */}
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
          Target Audience{" "}
          <span className="text-gray-300 normal-case font-normal">
            (select all that apply)
          </span>
        </label>

        {/* Toggle button */}
        <button
          onClick={() => setAudienceOpen(!audienceOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 border-[1.5px] rounded-xl text-sm transition-all
      ${
        contextData.targetAudience.length > 0
          ? "border-indigo-500 bg-indigo-50 text-indigo-900"
          : "border-gray-200 bg-white text-gray-400 hover:border-indigo-300"
      }`}
        >
          <span>
            {contextData.targetAudience.length > 0
              ? contextData.targetAudience.join(", ")
              : "Select audiences..."}
          </span>
          <span
            className={`text-base transition-transform duration-200 ${audienceOpen ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>

        {/* Expandable checkboxes */}
        {audienceOpen && (
          <div className="mt-1.5 border border-gray-200 rounded-xl overflow-hidden">
            {audienceOptions.map((option, i) => {
              const isChecked = contextData.targetAudience.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => {
                    const current = contextData.targetAudience;
                    const updated = isChecked
                      ? current.filter((a) => a !== option)
                      : [...current, option];
                    update("targetAudience", updated);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-left transition-all w-full
              ${i < audienceOptions.length - 1 ? "border-b border-gray-100" : ""}
              ${isChecked ? "bg-indigo-50" : "bg-white hover:bg-gray-50"}`}
                >
                  <div
                    className={`w-4 h-4 rounded border-[1.5px] shrink-0 flex items-center justify-center text-[10px] transition-all
              ${isChecked ? "bg-indigo-500 border-indigo-500 text-white" : "border-gray-300"}`}
                  >
                    {isChecked && "✓"}
                  </div>
                  <span
                    className={`text-sm font-medium ${isChecked ? "text-indigo-900" : "text-gray-700"}`}
                  >
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Feature / page type */}
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
          Feature / Page Type
        </label>
        <button
          onClick={() => setFeatureOpen(!featureOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 border-[1.5px] rounded-xl text-sm transition-all
      ${
        contextData.featureBeingDesigned
          ? "border-indigo-500 bg-indigo-50 text-indigo-900"
          : "border-gray-200 bg-white text-gray-400 hover:border-indigo-300"
      }`}
        >
          <span>
            {contextData.featureBeingDesigned ||
              "Select feature or page type..."}
          </span>
          <span
            className={`text-base transition-transform duration-200 ${featureOpen ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>
        {featureOpen && (
          <div className="mt-1.5 border border-gray-200 rounded-xl overflow-hidden">
            {featureOptions
              .filter((opt) => opt.value !== "")
              .map((opt, i) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    update("featureBeingDesigned", opt.value);
                    setFeatureOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-left w-full text-sm transition-all
            ${i < featureOptions.length - 2 ? "border-b border-gray-100" : ""}
            ${contextData.featureBeingDesigned === opt.value ? "bg-indigo-50 text-indigo-900" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  <div
                    className={`w-4 h-4 rounded border-[1.5px] shrink-0 flex items-center justify-center text-[10px] transition-all
            ${contextData.featureBeingDesigned === opt.value ? "bg-indigo-500 border-indigo-500 text-white" : "border-gray-300"}`}
                  >
                    {contextData.featureBeingDesigned === opt.value && "✓"}
                  </div>
                  {opt.label}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Project title — free text, optional */}
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          Project Title{" "}
          <span className="text-gray-300 normal-case font-normal">
            (optional)
          </span>
        </label>
        <input
          type="text"
          placeholder="e.g. Portfolio redesign, Checkout page"
          value={contextData.featureTitle}
          onChange={(e) => update("featureTitle", e.target.value)}
          className="w-full border-[1.5px] border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-gray-300"
        />
      </div>
    </div>
  );
}

export default ContextPanel;
