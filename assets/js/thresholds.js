/* ─────────── THRESHOLD TANAMAN ─────────── */
const THRESHOLDS = {
  padi: {
    label: "Padi",
    N:  { low: 120, high: 200, barMax: 300, color: "#639922", unit: "mg/kg" },
    P:  { low: 15,  high: 40,  barMax: 80,  color: "#1D9E75", unit: "mg/kg" },
    K:  { low: 100, high: 200, barMax: 300, color: "#378ADD", unit: "mg/kg" },
    PH: { low: 6.0, high: 7.0, unit: "0–14" },
    EC: { low: 0.8, high: 2.0, unit: "mS/cm" }
  },
  jagung: {
    label: "Jagung",
    N:  { low: 150, high: 250, barMax: 350, color: "#639922", unit: "mg/kg" },
    P:  { low: 20,  high: 50,  barMax: 90,  color: "#1D9E75", unit: "mg/kg" },
    K:  { low: 150, high: 250, barMax: 350, color: "#378ADD", unit: "mg/kg" },
    PH: { low: 5.5, high: 7.0, unit: "0–14" },
    EC: { low: 1.0, high: 2.5, unit: "mS/cm" }
  }
};

function getThreshold(crop) {
  return THRESHOLDS[crop] || THRESHOLDS.padi;
}
