const tabs = [
  { id: "text", icon: "✍️", label: "Text" },
  { id: "upload", icon: "📎", label: "Upload file" },
  { id: "url", icon: "🔗", label: "URL" },
];

function InputTabs({ activeTab, setActiveTab }) {
  return (
    <div className="grid grid-cols-3 bg-gray-100 border border-gray-200 rounded-xl p-1 gap-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg transition-all text-xs font-semibold
            ${
              activeTab === tab.id
                ? "bg-white shadow-sm border border-gray-200 text-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
        >
          <span className="text-base">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export default InputTabs;
