# Nandur - Smart Farming Dashboard

Agricultural environment monitoring and soil nutrient dashboard. Prototype designed to integrate with IoT devices (ESP32).

## Features

- **Guest Access** — View dashboard directly without an account (Device ID + API Key)
- **Account System** — Login/register to save data & manage multiple devices
- **Live Dashboard** — Temperature, air/soil humidity, light intensity
- **Nutrient Monitoring** — Nitrogen (N), Phosphorus (P), Potassium (K), pH, soil EC
- **Fertilization Recommendations** — Automated suggestions based on crop thresholds
- **Charts & History** — 24h / 7-day / 30-day charts + data history table
- **Multi-Crop Support** — Thresholds for Rice and Corn
- **Bilingual** — Indonesian / English language toggle
- **Multi-Device** — Add & remove devices from the account page

## Project Structure

```
nandur-app/
├── index.html            # Main page (login + dashboard)
├── account.html          # Account page + device management
├── assets/
│   ├── css/style.css     # Stylesheet
│   ├── img/              # Logo
│   └── js/
│       ├── main.js       # Core logic, navigation, i18n, charts
│       ├── devices.js    # Hardcoded device list
│       ├── thresholds.js # Crop-specific optimal thresholds
│       └── mock-data.js  # Simulated data generator
```

## Getting Started

Open `index.html` in a browser (no server needed — pure HTML/CSS/JS + localStorage).

### Guest Login

| Device ID  | API Key     |
|------------|-------------|
| ESP32_001  | rahasia123  |
| ESP32_002  | gantidong   |

### NPK Simulation (Console)

To test below/above threshold values, run in the browser console:

```js
simNPK()                                              // default low values
simNPK({ nitrogen: 250, fosfor: 10, kalium: 50 })     // custom
simNPK({ nitrogen: 30, fosfor: 5, kalium: 50, ph: 4.5, ec: 0.3 })
```

## Optimal Thresholds

### Rice

| Nutrient | Low   | Optimal | High  |
|----------|-------|---------|-------|
| N        | < 120 | 120–200 | > 200 |
| P        | < 15  | 15–40   | > 40  |
| K        | < 100 | 100–200 | > 200 |
| pH       | < 6.0 | 6.0–7.0 | > 7.0 |
| EC       | < 0.8 | 0.8–2.0 | > 2.0 |

### Corn

| Nutrient | Low   | Optimal | High  |
|----------|-------|---------|-------|
| N        | < 150 | 150–250 | > 250 |
| P        | < 20  | 20–50   | > 50  |
| K        | < 150 | 150–250 | > 250 |
| pH       | < 5.5 | 5.5–7.0 | > 7.0 |
| EC       | < 1.0 | 1.0–2.5 | > 2.5 |

## Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript
- Chart.js 4.4.0 (charts)
- localStorage / sessionStorage (data persistence)

## License

MIT
