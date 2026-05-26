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
  { value: "", label: "Select target audience..." },
  { value: "General Public", label: "General Public" },
  { value: "Business Professionals", label: "Business Professionals" },
  {
    value: "Domain Experts / Specialists",
    label: "Domain Experts / Specialists",
  },
  { value: "Developers / Technical", label: "Developers / Technical" },
  { value: "Enterprise / Executive", label: "Enterprise / Executive" },
  { value: "Students / Learners", label: "Students / Learners" },
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
  const update = (field, value) => {
    setContextData((prev) => ({ ...prev, [field]: value }));
  };

  const allSelected =
    contextData.industry &&
    contextData.targetAudience &&
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
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          Industry
        </label>
        <select
          value={contextData.industry}
          onChange={(e) => update("industry", e.target.value)}
          className={`w-full border-[1.5px] rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white outline-none transition
            ${
              contextData.industry
                ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                : "border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            }`}
        >
          {industryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Target audience */}
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          Target Audience
        </label>
        <select
          value={contextData.targetAudience}
          onChange={(e) => update("targetAudience", e.target.value)}
          className={`w-full border-[1.5px] rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white outline-none transition
            ${
              contextData.targetAudience
                ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                : "border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            }`}
        >
          {audienceOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Feature / page type */}
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          Feature / Page Type
        </label>
        <select
          value={contextData.featureBeingDesigned}
          onChange={(e) => update("featureBeingDesigned", e.target.value)}
          className={`w-full border-[1.5px] rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white outline-none transition
            ${
              contextData.featureBeingDesigned
                ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                : "border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            }`}
        >
          {featureOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
