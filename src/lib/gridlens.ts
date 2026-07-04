import { createContext, useContext } from "react";

export const API_BASE_URL = "https://gridlens-backend-my.onrender.com";
export type Detection = {
  label: string;
  confidence: number;
  box?: [number, number, number, number];
  id?: string;
};

export type Violation = {
  timestamp: string;
  violation_type: string;
  confidence: number;
  vehicle_id: string;
  number_plate: string;
  evidence: string;
  status: string;
};

export type OcrCandidate = {
  text: string;
  confidence: number;
};

export type AnalyzeResponse = {
  message: string;
  detections: Detection[];
  violations: Violation[];
  ocr_candidates: OcrCandidate[];
  annotated_image_base64: string;
};

export type SavedRecord = Violation & { id: number };

export type Settings = {
  confidence_threshold: number;
  enhance_image: boolean;
  enable_ocr: boolean;
  simulate_helmet: boolean;
  simulate_stop_line: boolean;
  simulate_red_light: boolean;
  simulate_illegal_parking: boolean;
};

export const defaultSettings: Settings = {
  confidence_threshold: 0.5,
  enhance_image: true,
  enable_ocr: true,
  simulate_helmet: true,
  simulate_stop_line: true,
  simulate_red_light: true,
  simulate_illegal_parking: false,
};

export const SettingsContext = createContext<{
  settings: Settings;
  setSettings: (patch: Partial<Settings>) => void;
} | null>(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("SettingsContext missing");
  return ctx;
}

// ---- Demo data used when the backend is unreachable ----

export const demoAnalyze: AnalyzeResponse = {
  message: "analysis_completed",
  detections: [
    { label: "motorcycle", confidence: 0.91, box: [120, 210, 380, 470], id: "motorcycle_1" },
    { label: "person", confidence: 0.88, box: [140, 130, 250, 320], id: "person_1" },
    { label: "person", confidence: 0.82, box: [220, 140, 320, 330], id: "person_2" },
    { label: "person", confidence: 0.76, box: [280, 150, 370, 340], id: "person_3" },
    { label: "car", confidence: 0.79, box: [500, 260, 820, 470], id: "car_1" },
  ],
  violations: [
    {
      timestamp: "2026-06-21 14:00:00",
      violation_type: "Triple Riding",
      confidence: 0.84,
      vehicle_id: "motorcycle_1",
      number_plate: "KA05KN9471",
      evidence: "3 persons detected around motorcycle",
      status: "Review Required",
    },
    {
      timestamp: "2026-06-21 14:00:02",
      violation_type: "Helmet Non-Compliance",
      confidence: 0.77,
      vehicle_id: "motorcycle_1",
      number_plate: "KA05KN9471",
      evidence: "No helmet detected on rider",
      status: "Review Required",
    },
    {
      timestamp: "2026-06-21 14:00:05",
      violation_type: "Stop-Line Violation",
      confidence: 0.71,
      vehicle_id: "car_1",
      number_plate: "KA01MJ2210",
      evidence: "Vehicle crossed stop-line during red signal",
      status: "Pending",
    },
  ],
  ocr_candidates: [
    { text: "KA05KN9471", confidence: 0.88 },
    { text: "KA01MJ2210", confidence: 0.74 },
  ],
  annotated_image_base64: "",
};

export const demoRecords: SavedRecord[] = [
  {
    id: 1,
    timestamp: "2026-06-20 09:12:44",
    violation_type: "Red-Light Violation",
    confidence: 0.92,
    vehicle_id: "car_17",
    number_plate: "KA03MB1122",
    evidence: "Vehicle crossed intersection at red phase",
    status: "Confirmed",
  },
  {
    id: 2,
    timestamp: "2026-06-20 10:41:03",
    violation_type: "Helmet Non-Compliance",
    confidence: 0.81,
    vehicle_id: "motorcycle_5",
    number_plate: "KA05AB4471",
    evidence: "Rider without helmet detected",
    status: "Review Required",
  },
  {
    id: 3,
    timestamp: "2026-06-20 11:22:19",
    violation_type: "Triple Riding",
    confidence: 0.79,
    vehicle_id: "motorcycle_9",
    number_plate: "KA10ZX9012",
    evidence: "3 persons detected on motorcycle",
    status: "Confirmed",
  },
  {
    id: 4,
    timestamp: "2026-06-20 12:03:55",
    violation_type: "Illegal Parking",
    confidence: 0.68,
    vehicle_id: "car_31",
    number_plate: "KA02CD7788",
    evidence: "Vehicle parked in no-parking zone",
    status: "Pending",
  },
  {
    id: 5,
    timestamp: "2026-06-20 13:45:11",
    violation_type: "Stop-Line Violation",
    confidence: 0.74,
    vehicle_id: "car_42",
    number_plate: "KA07PL3344",
    evidence: "Vehicle crossed stop-line at signal",
    status: "Dismissed",
  },
];

export async function analyzeImage(
  file: File,
  settings: Settings,
  signal?: AbortSignal,
): Promise<{ data: AnalyzeResponse; demo: boolean }> {
  const fd = new FormData();
  fd.append("image", file);
  fd.append("enhance_image", String(settings.enhance_image));
  fd.append("enable_ocr", String(settings.enable_ocr));
  fd.append("simulate_helmet", String(settings.simulate_helmet));
  fd.append("simulate_stop_line", String(settings.simulate_stop_line));
  fd.append("simulate_red_light", String(settings.simulate_red_light));
  fd.append("simulate_illegal_parking", String(settings.simulate_illegal_parking));
  fd.append("confidence_threshold", String(settings.confidence_threshold));

  try {
    const res = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      body: fd,
      signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as AnalyzeResponse;
    return { data, demo: false };
  } catch {
    return { data: demoAnalyze, demo: true };
  }
}

export async function fetchRecords(
  signal?: AbortSignal,
): Promise<{ data: SavedRecord[]; demo: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/records`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as SavedRecord[];
    return { data, demo: false };
  } catch {
    return { data: demoRecords, demo: true };
  }
}

export function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  const s = status.toLowerCase();
  if (s.includes("confirm")) return "default";
  if (s.includes("dismiss")) return "outline";
  if (s.includes("review")) return "destructive";
  return "secondary";
}

export function violationsToCsv(rows: Violation[]): string {
  const headers = [
    "timestamp",
    "violation_type",
    "confidence",
    "vehicle_id",
    "number_plate",
    "evidence",
    "status",
  ];
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.timestamp,
        r.violation_type,
        r.confidence,
        r.vehicle_id,
        r.number_plate,
        r.evidence,
        r.status,
      ]
        .map((v) => escape(String(v)))
        .join(","),
    );
  }
  return lines.join("\n");
}