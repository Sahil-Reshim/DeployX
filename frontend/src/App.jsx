import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div className="dashboard">
      <div className="bg-container">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-grid"></div>
      </div>
      <Dashboard />
    </div>
  );
}

export default App;
