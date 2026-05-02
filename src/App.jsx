import Navbar from "./components/layout/Navbar";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">
          UX Feedback <span className="text-indigo-500">Assistant</span>
        </h1>
      </div>
    </div>
  );
}

export default App;
