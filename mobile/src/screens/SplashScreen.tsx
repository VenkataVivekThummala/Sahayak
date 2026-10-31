import React, { useEffect } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { lightColors } from "../theme/tokens";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { hasChosenLanguage } = useSettingsStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      data-testid="splash-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: lightColors.navy,
        color: "#FFFFFF",
        fontFamily: "'Noto Sans Telugu', sans-serif",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <h1 style={{ fontSize: "36px", margin: "0 0 8px 0", fontWeight: 700 }}>
        గవర్నమెంట్ సహాయక్
      </h1>
      <h2 style={{ fontSize: "24px", margin: "0 0 16px 0", fontWeight: 500, opacity: 0.9 }}>
        Government Sahayak
      </h2>
      <div
        style={{
          width: "80px",
          height: "4px",
          backgroundColor: lightColors.saffron,
          borderRadius: "2px",
          marginBottom: "24px",
        }}
      />
      <p style={{ fontSize: "16px", opacity: 0.8, maxWidth: "320px" }}>
        ప్రజా సంక్షేమ పథకాల సమాచార మార్గదర్శి
        <br />
        Official Public Welfare Scheme Guide
      </p>
    </div>
  );
};
