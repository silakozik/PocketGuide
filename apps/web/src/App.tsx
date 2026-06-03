import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import MapPage from "./pages/MapPage";
import ProfilePage from "./pages/ProfilePage";
import OnboardingPage from "./pages/OnboardingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminCitiesPage from "./pages/admin/AdminCitiesPage";
import AdminGuard from "./components/admin/AdminGuard";
import AuthGuard from "./components/AuthGuard";
import { AuthProvider } from "./context/AuthContext";
import { AIAssistantProvider } from "./context/AIAssistantContext";
import { RouteProvider } from "./context/RouteContext";
import { AIAssistantPanel } from "./components/AIAssistantPanel";
import FirstDayPage from "./pages/FirstDayPage";
import CityHubPage from "./pages/CityHubPage";
import PlacesExplorePage from "./pages/PlacesExplorePage";
import TransfersPage from "./pages/TransfersPage";
import RoutePlannerPage from "./pages/RoutePlannerPage";

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    if (
      location.pathname === "/login" ||
      location.pathname === "/register" ||
      location.pathname.startsWith("/explore") ||
      location.pathname === "/plan"
    ) {
      return;
    }

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
      <AuthProvider>
        <RouteProvider>
          <AIAssistantProvider>
            <OnboardingGuard>
              <AIAssistantPanel />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/explore/:placeCategory" element={<PlacesExplorePage />} />
                <Route
                  path="/profile"
                  element={
                    <AuthGuard>
                      <ProfilePage />
                    </AuthGuard>
                  }
                />
                <Route path="/:citySlug/first-day" element={<FirstDayPage />} />
                <Route path="/:citySlug" element={<CityHubPage />} />
                <Route path="/transfer" element={<TransfersPage />} />
                <Route path="/plan" element={<RoutePlannerPage />} />

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
          </AIAssistantProvider>
        </RouteProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
