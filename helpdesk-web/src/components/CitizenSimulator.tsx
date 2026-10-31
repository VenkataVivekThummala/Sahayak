import React from "react";
import MobileApp from "../../../mobile/src/App";

interface Props {
  onOpenStaffLogin?: () => void;
}

export const CitizenSimulator: React.FC<Props> = () => {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "calc(100vh - 64px)",
        backgroundColor: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Full-Width Web Application Container */}
      <div
        style={{
          width: "100%",
          maxWidth: "1140px",
          backgroundColor: "#FAF7F2",
          minHeight: "calc(100vh - 64px)",
          boxShadow: "0 0 30px rgba(0, 0, 0, 0.06)",
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid #E2E8F0",
          borderRight: "1px solid #E2E8F0",
        }}
      >
        {React.createElement(MobileApp as any)}
      </div>
    </div>
  );
};
