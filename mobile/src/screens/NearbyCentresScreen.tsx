import React, { useState } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { getStrings } from "../i18n/strings";
import { lightColors } from "../theme/tokens";

interface NearbyCentresScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

interface ServiceCenter {
  id: string;
  name: string;
  type: string;
  type_te: string;
  address: string;
  distance: string;
  hours: string;
  phone: string;
}

export const NearbyCentresScreen: React.FC<NearbyCentresScreenProps> = ({ onNavigate }) => {
  const { language } = useSettingsStore();
  const strings = getStrings(language);
  const [filterType, setFilterType] = useState<string>("all");

  const centers: ServiceCenter[] = [
    {
      id: "sc-1",
      name: "Grama Sachivalayam - Penamaluru",
      type: "Sachivalayam",
      type_te: "గ్రామ సచివాలయం",
      address: "Main Road, Penamaluru, Krishna Dist, AP",
      distance: "0.8 km",
      hours: "10:00 AM - 05:00 PM (Mon-Sat)",
      phone: "0866-2451001",
    },
    {
      id: "sc-2",
      name: "AP MeeSeva Centre #412",
      type: "MeeSeva",
      type_te: "మీసేవ కేంద్రం",
      address: "Bypass Junction, Vijayawada Rural, AP",
      distance: "1.4 km",
      hours: "09:30 AM - 06:00 PM (Mon-Sat)",
      phone: "0866-2582044",
    },
    {
      id: "sc-3",
      name: "Common Service Centre (CSC) Digital Seva",
      type: "CSC",
      type_te: "కామన్ సర్వీస్ సెంటర్",
      address: "Near Panchayat Office, Poranki, AP",
      distance: "2.1 km",
      hours: "09:00 AM - 07:00 PM (Daily)",
      phone: "9848022338",
    },
    {
      id: "sc-4",
      name: "Sub Post Office - Poranki",
      type: "Post Office",
      type_te: "తపాలా కార్యాలయం",
      address: "Station Road, Poranki, Krishna Dist, AP",
      distance: "2.5 km",
      hours: "09:00 AM - 03:00 PM (Mon-Fri)",
      phone: "0866-2499120",
    },
  ];

  const filteredCenters = filterType === "all" ? centers : centers.filter((c) => c.type === filterType);

  return (
    <div
      data-testid="centres-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: lightColors.paper,
        color: lightColors.ink,
        fontFamily: "'Noto Sans Telugu', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          backgroundColor: lightColors.navy,
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => onNavigate("home")}
            style={{ background: "none", border: "none", color: "#FFFFFF", fontSize: "20px", cursor: "pointer" }}
          >
            ←
          </button>
          <span style={{ fontSize: "18px", fontWeight: 700 }}>{strings.nearby_centres}</span>
        </div>
      </header>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          padding: "10px 16px",
          gap: "8px",
          backgroundColor: lightColors.surface,
          borderBottom: `1px solid ${lightColors.rule}`,
        }}
      >
        <button
          type="button"
          onClick={() => setFilterType("all")}
          style={{
            padding: "6px 14px",
            border: "none",
            borderRadius: "20px",
            backgroundColor: filterType === "all" ? lightColors.navy : lightColors.paper,
            color: filterType === "all" ? "#FFFFFF" : lightColors.ink,
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {language === "te" ? "అన్నీ" : "All"}
        </button>
        <button
          type="button"
          onClick={() => setFilterType("Sachivalayam")}
          style={{
            padding: "6px 14px",
            border: "none",
            borderRadius: "20px",
            backgroundColor: filterType === "Sachivalayam" ? lightColors.navy : lightColors.paper,
            color: filterType === "Sachivalayam" ? "#FFFFFF" : lightColors.ink,
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {language === "te" ? "సచివాలయం" : "Sachivalayam"}
        </button>
        <button
          type="button"
          onClick={() => setFilterType("MeeSeva")}
          style={{
            padding: "6px 14px",
            border: "none",
            borderRadius: "20px",
            backgroundColor: filterType === "MeeSeva" ? lightColors.navy : lightColors.paper,
            color: filterType === "MeeSeva" ? "#FFFFFF" : lightColors.ink,
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          MeeSeva
        </button>
        <button
          type="button"
          onClick={() => setFilterType("CSC")}
          style={{
            padding: "6px 14px",
            border: "none",
            borderRadius: "20px",
            backgroundColor: filterType === "CSC" ? lightColors.navy : lightColors.paper,
            color: filterType === "CSC" ? "#FFFFFF" : lightColors.ink,
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          CSC
        </button>
      </div>

      {/* Centers List */}
      <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredCenters.map((c) => (
          <div
            key={c.id}
            data-testid={`center-card-${c.id}`}
            style={{
              backgroundColor: lightColors.surface,
              border: `1px solid ${lightColors.rule}`,
              borderRadius: "8px",
              padding: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: lightColors.navy, fontWeight: 700 }}>
                {c.name}
              </h3>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: lightColors.saffron,
                  backgroundColor: "#FFF3E0",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                {c.distance}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: lightColors.inkSecondary, marginBottom: "4px" }}>
              📍 {c.address}
            </div>
            <div style={{ fontSize: "12px", color: lightColors.inkSecondary, marginBottom: "4px" }}>
              ⏰ {c.hours}
            </div>
            <div style={{ fontSize: "13px", color: lightColors.navy, marginBottom: "10px" }}>
              📞 <a href={`tel:${c.phone}`} style={{ color: lightColors.navy, textDecoration: "none" }}>{c.phone}</a>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(c.address)}`, "_blank")}
                style={{
                  flex: 1,
                  padding: "8px",
                  backgroundColor: lightColors.paper,
                  border: `1px solid ${lightColors.navy}`,
                  color: lightColors.navy,
                  borderRadius: "4px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                🗺️ {language === "te" ? "దారి చూపించు" : "Get Directions"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
