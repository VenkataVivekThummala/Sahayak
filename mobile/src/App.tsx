import React, { useState } from "react";
import { useSettingsStore } from "./store/settingsStore";
import { SplashScreen } from "./screens/SplashScreen";
import { LanguageSelectScreen } from "./screens/LanguageSelectScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { AssistantScreen } from "./screens/AssistantScreen";
import { SchemeListScreen } from "./screens/SchemeListScreen";
import { SchemeDetailScreen } from "./screens/SchemeDetailScreen";
import { EligibilityCheckerScreen } from "./screens/EligibilityCheckerScreen";
import { DocumentChecklistScreen } from "./screens/DocumentChecklistScreen";
import { ApplicationGuideScreen } from "./screens/ApplicationGuideScreen";
import { NearbyCentresScreen } from "./screens/NearbyCentresScreen";
import { HelpDeskScreen } from "./screens/HelpDeskScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { GlossaryScreen } from "./screens/GlossaryScreen";
import { CitizenAuthScreen } from "./screens/CitizenAuthScreen";
import { SchemePortfolioScreen } from "./screens/SchemePortfolioScreen";
import { useCitizenAuthStore } from "./store/citizenAuthStore";

export const App: React.FC = () => {
  const { isAuthenticated } = useCitizenAuthStore();
  const [currentScreen, setCurrentScreen] = useState<string>("splash");
  const [navParams, setNavParams] = useState<Record<string, any>>({});

  const handleNavigate = (screen: string, params?: Record<string, any>) => {
    setNavParams(params || {});
    setCurrentScreen(screen);
  };

  const handleSplashComplete = () => {
    // If citizen is not logged in, show Citizen Login directly!
    if (!isAuthenticated) {
      setCurrentScreen("citizen-login");
    } else {
      setCurrentScreen("home");
    }
  };

  switch (currentScreen) {
    case "splash":
      return <SplashScreen onComplete={handleSplashComplete} />;

    case "language-select":
      return (
        <LanguageSelectScreen
          onContinue={() => setCurrentScreen("home")}
          onCitizenLogin={() => setCurrentScreen("citizen-login")}
        />
      );

    case "home":
      return <HomeScreen onNavigate={handleNavigate} />;

    case "assistant":
      return (
        <AssistantScreen
          initialMessage={navParams.initialMessage}
          startListening={navParams.startListening}
          preScopedSchemeId={navParams.preScopedSchemeId}
          onNavigate={handleNavigate}
        />
      );

    case "schemes":
      return <SchemeListScreen onNavigate={handleNavigate} />;

    case "scheme-detail":
      return (
        <SchemeDetailScreen
          schemeId={navParams.schemeId}
          onNavigate={handleNavigate}
        />
      );

    case "eligibility":
      return (
        <EligibilityCheckerScreen
          schemeId={navParams.schemeId}
          onNavigate={handleNavigate}
        />
      );

    case "documents":
      return (
        <DocumentChecklistScreen
          schemeId={navParams.schemeId}
          onNavigate={handleNavigate}
        />
      );

    case "steps":
      return (
        <ApplicationGuideScreen
          schemeId={navParams.schemeId}
          onNavigate={handleNavigate}
        />
      );

    case "centres":
      return <NearbyCentresScreen onNavigate={handleNavigate} />;

    case "helpdesk":
      return <HelpDeskScreen onNavigate={handleNavigate} />;

    case "settings":
      return <SettingsScreen onNavigate={handleNavigate} />;

    case "glossary":
      return <GlossaryScreen onNavigate={handleNavigate} />;

    case "citizen-login":
      return (
        <CitizenAuthScreen
          onSuccess={() => setCurrentScreen("home")}
          onCancel={() => setCurrentScreen("home")}
        />
      );

    case "portfolio":
      return <SchemePortfolioScreen onNavigate={handleNavigate} />;

    default:
      return <HomeScreen onNavigate={handleNavigate} />;
  }
};

export default App;
