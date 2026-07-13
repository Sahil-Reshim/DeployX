import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Dashboard from "./pages/Dashboard";

const LandingPage = lazy(() => import("./pages/LandingPage/LandingPage"));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={
              <div className="loader-container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="loader-ring">
                  <div className="loader-ring-outer"></div>
                  <div className="loader-ring-inner"></div>
                </div>
              </div>
            }>
              <LandingPage />
            </Suspense>
          }
        />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;