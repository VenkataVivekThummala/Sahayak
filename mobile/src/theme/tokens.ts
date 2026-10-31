/**
 * Government Sahayak Design Tokens
 * Conforming strictly to Section 5 Design Specification.
 */

export interface ColorTheme {
  paper: string;
  surface: string;
  ink: string;
  inkSecondary: string;
  rule: string;
  navy: string;
  navyDark: string;
  saffron: string;
  ok: string;
  warn: string;
  warnBg: string;
  bad: string;
}

export const lightColors: ColorTheme = {
  paper: "#FAF7F2",       // background, warm off-white
  surface: "#FFFFFF",     // cards/elevated surfaces
  ink: "#1A1A1A",         // high-contrast primary text (>= 7:1)
  inkSecondary: "#4A4A4A",// secondary text (>= 4.5:1)
  rule: "#D9D2C5",        // hairlines, 1px dividers
  navy: "#14315C",        // primary action buttons and headers
  navyDark: "#0D2142",    // pressed states
  saffron: "#C8691A",     // accent: mic button, active tab marker
  ok: "#1F6B3A",          // eligible status
  warn: "#8A5A00",        // warning / undecided text
  warnBg: "#FFF1CC",      // warning background
  bad: "#A62A21",         // not eligible / errors
};

export const darkColors: ColorTheme = {
  paper: "#161412",       // warm dark background
  surface: "#1F1C19",     // dark surface
  ink: "#F1ECE4",         // high-contrast text
  inkSecondary: "#A8A29A",// secondary text
  rule: "#3A352F",        // dark dividers
  navy: "#14315C",        // primary button background
  navyDark: "#0D2142",    // button pressed
  saffron: "#E58A3A",     // accent highlight
  ok: "#6CC58C",          // eligible status
  warn: "#F2C66B",        // caution text
  warnBg: "#3A2D0A",      // caution background
  bad: "#F28B82",         // not eligible status
};

export const typography = {
  fontFamily: "Noto Sans Telugu",
  sizes: {
    caption: 14,
    body: 18,
    label: 20,
    title: 24,
    heading: 30,
  },
  lineHeights: {
    telugu: 1.55,
    latin: 1.4,
  },
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  }
};

export const layout = {
  grid: 8,
  minTapTarget: 48,
  primaryButtonHeight: 56,
  listRowHeight: 64,
  micHeroSize: 88,
  micListeningSize: 96,
  borderRadius: 8,
};
