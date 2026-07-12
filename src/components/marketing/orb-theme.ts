export type OrbTheme = "light" | "dark";

/** Romantic palette tuned for LoveProfile AI light blush and moonnight dark */
export const ORB_THEME = {
  light: {
    heart: {
      colors: {
        rose: "#D4788A",
        coral: "#E8785A",
        lavender: "#9B87C8",
        blush: "#F5C4CE",
        gold: "#D4A84A",
      },
      emissive: "#E8785A",
      emissiveIntensity: 0.48,
      glowColors: ["#F5C4CE", "#9B87C8", "#E8785A"] as const,
      glowOpacity: 0.44,
      innerLight: "#FFB8C8",
      innerLightIntensity: 0.72,
      scale: 0.7,
    },
    shell: {
      color: "#E8A0B0",
      emissive: "#D4788A",
      emissiveIntensity: 0.42,
      opacity: 0.4,
    },
    halo: {
      color: "#D4788A",
      opacity: 0.22,
    },
    lights: {
      ambient: { intensity: 0.78, color: "#FFF8F5" },
      key: { intensity: 0.75, color: "#ffffff" },
      fill: { intensity: 0.55, color: "#F5C4CE" },
      rim: { intensity: 0.62, color: "#EDE6FA" },
      accent: { intensity: 0.5, color: "#9B87C8" },
    },
    stars: { count: 750, factor: 2.2, saturation: 0.72 },
    ribbons: { rose: "#D4788A", lavender: "#9B87C8", coral: "#E8785A" },
  },
  dark: {
    heart: {
      colors: {
        rose: "#FF4D7E",
        coral: "#F2926F",
        lavender: "#C9A0E8",
        blush: "#FF8FAB",
        gold: "#E9C46A",
      },
      emissive: "#D4A0FF",
      emissiveIntensity: 0.55,
      glowColors: ["#FF6B9D", "#B9AEDE", "#E9C46A"] as const,
      glowOpacity: 0.48,
      innerLight: "#E8A0FF",
      innerLightIntensity: 0.75,
      scale: 0.7,
    },
    shell: {
      color: "#E8A5B0",
      emissive: "#B9AEDE",
      emissiveIntensity: 0.5,
      opacity: 0.32,
    },
    halo: {
      color: "#B9AEDE",
      opacity: 0.24,
    },
    lights: {
      ambient: { intensity: 0.52, color: "#F4EFEA" },
      key: { intensity: 0.62, color: "#ffffff" },
      fill: { intensity: 0.55, color: "#c9a8d6" },
      rim: { intensity: 0.5, color: "#F4EFEA" },
      accent: { intensity: 0.48, color: "#FF8FAB" },
    },
    stars: { count: 1400, factor: 2.8, saturation: 0.55 },
    ribbons: { rose: "#FF8FAB", lavender: "#C9A0E8", coral: "#F2926F" },
  },
} as const;
