export type LevelAtmosphere = {
  id: "launchpad" | "cloudline" | "sunrise" | "starlane" | "deep-space";
  label: string;
  description: string;
  emoji: string;
};

const ATMOSPHERES: LevelAtmosphere[] = [
  {
    id: "launchpad",
    label: "Launchpad",
    description: "Warm up your instruments and find your bearings.",
    emoji: "🛰️",
  },
  {
    id: "cloudline",
    label: "Cloudline",
    description: "The air gets lighter as your thinking gets sharper.",
    emoji: "☁️",
  },
  {
    id: "sunrise",
    label: "Sunrise Arc",
    description: "A bright horizon for bigger ideas and longer climbs.",
    emoji: "🌤️",
  },
  {
    id: "starlane",
    label: "Starlane",
    description: "Follow the signal through a field of new patterns.",
    emoji: "🌌",
  },
  {
    id: "deep-space",
    label: "Deep Space",
    description: "Stay precise. The hardest routes reward calm focus.",
    emoji: "🪐",
  },
];

export function getLevelAtmosphere(level: number): LevelAtmosphere {
  const safeLevel = Math.max(1, Math.floor(level));
  const atmosphereIndex = Math.min(ATMOSPHERES.length - 1, Math.floor((safeLevel - 1) / 3));
  return ATMOSPHERES[atmosphereIndex] ?? ATMOSPHERES[0];
}
