import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import MapPage from "./pages/MapPage";
import ProfilePage from "./pages/ProfilePage";
import OnboardingPage from "./pages/OnboardingPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminCitiesPage from "./pages/admin/AdminCitiesPage";
import AdminGuard from "./components/admin/AdminGuard";
import FirstDayPage from "./pages/FirstDayPage";

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Skip onboarding check for admin routes
    if (location.pathname.startsWith("/admin")) return;

    const hasOnboarded = localStorage.getItem("pg_has_onboarded");
    if (!hasOnboarded && location.pathname !== "/onboarding") {
      navigate("/onboarding");
    }
  }, [navigate, location]);

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <OnboardingGuard>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/:citySlug/first-day" element={<FirstDayPage />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/cities"
            element={
              <AdminGuard>
                <AdminCitiesPage />
              </AdminGuard>
            }
          />
        </Routes>
      </OnboardingGuard>
    </BrowserRouter>
  );
}
