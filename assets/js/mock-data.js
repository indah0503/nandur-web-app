/* ─────────── GENERATE MOCK DATA (untuk development/testing) ─────────── */

function genData(id, days) {
  const now = Date.now(), arr = [];
  for (let i = days * 24; i >= 0; i--) {
    const t = new Date(now - i * 3600000);
    const hr = t.getHours();
    let base = 28;
    if (hr >= 6 && hr <= 12) base = 28 + (hr - 6) * 1.2;
    else if (hr > 12 && hr <= 15) base = 35;
    else if (hr > 15 && hr <= 18) base = 35 - (hr - 15) * 2;
    else base = 24;
    const temp  = +(base + (Math.random() - .5) * 2).toFixed(1);
    const hum   = +Math.max(30, Math.min(100, 80 - (temp - 24) * 2.5 + (Math.random() - .5) * 5)).toFixed(1);
    const soil  = +Math.max(0, Math.min(100, 60 + (Math.random() - .5) * 6)).toFixed(0);
    const light = hr >= 6 && hr <= 18
      ? +((hr - 6) / 12 * 2000 + (Math.random() - .5) * 200).toFixed(0)
      : +(Math.random() * 10).toFixed(0);

    const nitrogen = +(140 + (Math.random() - .5) * 40).toFixed(0);
    const fosfor   = +(22  + (Math.random() - .5) * 12).toFixed(0);
    const kalium   = +(160 + (Math.random() - .5) * 60).toFixed(0);
    const ph       = +(6.4 + (Math.random() - .5) * 0.8).toFixed(1);
    const ec       = +(1.4 + (Math.random() - .5) * 0.6).toFixed(2);

    arr.push({ ts: t.toISOString(), temp, hum, soil, light, nitrogen, fosfor, kalium, ph, ec });
  }
  return arr;
}

/* ─── Auto add data tiap 5 menit (simulasi sensor) ─── */
setInterval(() => {
  const dev = getActiveDevice();
  if (!dev) return;

  const last = getData(dev.id).at(-1);
  const v = () => (Math.random() - 0.5) * 2;

  addDataPoint(
    dev.id,
    +(last.temp + v()).toFixed(1),
    +(last.hum + v()).toFixed(1),
    Math.min(100, Math.max(0, last.soil + Math.round(v()))),
    Math.min(2200, Math.max(0, last.light + Math.round(v() * 20))),
    +(last.nitrogen + Math.round(v() * 5)).toFixed(0),
    +(last.fosfor + Math.round(v() * 2)).toFixed(0),
    +(last.kalium + Math.round(v() * 5)).toFixed(0),
    +(last.ph + (Math.random() - 0.5) * 0.1).toFixed(1),
    +(last.ec + (Math.random() - 0.5) * 0.05).toFixed(2)
  );
  if ($('ch1')) load();
}, 300000);
