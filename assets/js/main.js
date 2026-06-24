/* ─────────── STATE ─────────── */
let c1 = null, c2 = null, c3 = null, curRange = "24h", timer = null;
const $ = s => document.getElementById(s);

/* ─────────── CROP / THRESHOLD ─────────── */
function getCrop() {
  try { return sessionStorage.getItem("sf_crop") || "padi"; } catch { return "padi"; }
}

function getCurrentThreshold() {
  return getThreshold(getCrop());
}

function getData(id) {
  let d = localStorage.getItem("sf_" + id);
  if (d) {
    const parsed = JSON.parse(d);
    if (parsed.length && parsed[0].nitrogen == null) {
      localStorage.removeItem("sf_" + id);
      return getData(id);
    }
    return parsed;
  }
  d = genData(id, 7);
  localStorage.setItem("sf_" + id, JSON.stringify(d));
  return d;
}

function addDataPoint(id, temp, hum, soil, light, nitrogen, fosfor, kalium, ph, ec) {
  const d = getData(id);
  d.push({ ts: new Date().toISOString(), temp, hum, soil, light, nitrogen, fosfor, kalium, ph, ec });
  if (d.length > 10000) d.splice(0, d.length - 10000);
  localStorage.setItem("sf_" + id, JSON.stringify(d));
}

/* ─────────── FILTER ─────────── */
function filter(arr, range) {
  const ms = { "24h": 864e5, "7d": 6048e5, "30d": 2592e6 }[range] || 864e5;
  return arr.filter(d => Date.now() - new Date(d.ts).getTime() <= ms);
}

/* ─────────── DEVICES (hardcoded + registered) ─────────── */
function getRegisteredDevices() {
  try { return JSON.parse(localStorage.getItem("sf_registered_devices")) || []; } catch { return []; }
}

function getAllDevices() {
  return [...DEVICES, ...getRegisteredDevices()];
}

/* ─────────── USER AUTH (localStorage) ─────────── */
function getUsers() {
  try { return JSON.parse(localStorage.getItem("sf_users")) || []; } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem("sf_users", JSON.stringify(users));
}

function registerUser(name, email, password) {
  const users = getUsers();
  if (users.find(u => u.email === email)) return false;
  users.push({ name, email, password, devices: [] });
  saveUsers(users);
  return true;
}

function authUser(email, password) {
  const users = getUsers();
  return users.find(u => u.email === email && u.password === password) || null;
}

function getLoggedInUser() {
  try { return JSON.parse(sessionStorage.getItem("sf_logged_user")); } catch { return null; }
}

function setLoggedInUser(user) {
  sessionStorage.setItem("sf_logged_user", JSON.stringify(user));
}

function logoutUser() {
  sessionStorage.removeItem("sf_logged_user");
  sessionStorage.removeItem("sf_active_device");
}

/* ─────────── ACTIVE DEVICE SESSION ─────────── */
function getActiveDevice() {
  try { return JSON.parse(sessionStorage.getItem("sf_active_device")); } catch { return null; }
}

function setActiveDevice(dev) {
  sessionStorage.setItem("sf_active_device", JSON.stringify(dev));
}

/* ─────────── DEVICE MANAGEMENT (per user) ─────────── */
function getUserDevices() {
  const user = getLoggedInUser();
  if (!user) return [];
  const users = getUsers();
  const fresh = users.find(u => u.email === user.email);
  return fresh ? fresh.devices : [];
}

function addUserDevice(id, key, name, crop) {
  const user = getLoggedInUser();
  if (!user) return false;
  const users = getUsers();
  const u = users.find(u => u.email === user.email);
  if (!u) return false;
  if (u.devices.find(d => d.id === id)) return false;
  u.devices.push({ id, key, name, crop });
  saveUsers(users);
  setLoggedInUser(u);
  return true;
}

function removeUserDevice(id) {
  const user = getLoggedInUser();
  if (!user) return;
  const users = getUsers();
  const u = users.find(u => u.email === user.email);
  if (!u) return;
  u.devices = u.devices.filter(d => d.id !== id);
  saveUsers(users);
  setLoggedInUser(u);
}

function loginDevice(id, key) {
  const devices = getUserDevices();
  return devices.find(d => d.id === id && d.key === key) || null;
}

/* ─────────── NAVIGATION ─────────── */
function goToDash(dev) {
  if (dev) setActiveDevice(dev);
  window.location.href = 'index.html';
}

function goToAccount() {
  window.location.href = 'akun.html';
}

function goToLogin() {
  window.location.href = 'index.html';
}

/* ─────────── SCREEN DISPLAY (same-page) ─────────── */
function hideAllScreens() {
  ["loginScreen", "dashScreen", "accountScreen"].forEach(id => {
    const el = $(id);
    if (el) {
      el.classList.remove("active");
      el.style.display = "none";
    }
  });
}

function displayDash(dev) {
  hideAllScreens();
  $("dashScreen").style.display = "block";
  $("dashScreen").classList.add("active");
  $("devName").textContent = dev.name;
  const crop = dev.crop || getCrop();
  sessionStorage.setItem("sf_crop", crop);
  const th = getThreshold(crop);
  $("cropLabel").textContent = "Tanaman: " + th.label;
  load();
  if (timer) clearInterval(timer);
  timer = setInterval(load, 30000);
}

function displayLogin() {
  hideAllScreens();
  $("loginScreen").style.display = "flex";
  $("loginScreen").classList.add("active");
  if (timer) { clearInterval(timer); timer = null; }
  [c1, c2, c3].forEach(c => { if (c) c.destroy(); });
  c1 = c2 = c3 = null;
}

function displayAccount() {
  const user = getLoggedInUser();
  if (!user) { goToLogin(); return; }
  hideAllScreens();
  $("accountScreen").style.display = "block";
  $("accountScreen").classList.add("active");
  $("accName").textContent = user.name;
  $("accEmail").textContent = user.email;
  renderDeviceList();
}

function renderDeviceList() {
  const devices = getUserDevices();
  const active = getActiveDevice();
  const list = $("deviceList");
  if (!devices.length) {
    list.innerHTML = '<div class="empty">Belum ada perangkat. Klik "+ Tambah Perangkat" untuk menambahkan.</div>';
    return;
  }
  list.innerHTML = devices.map(d => {
    const th = getThreshold(d.crop || "padi");
    const isActive = active && d.id === active.id;
    return `<div class="device-item${isActive ? " active" : ""}">
      <div class="device-info">
        <div class="device-name">${d.name}</div>
        <div class="device-id">${d.id} &middot; ${th.label}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        ${isActive ? '<span class="tag tag-crop">Aktif</span>' : ""}
        <button class="btn-icon btn-login-dev" data-id="${d.id}" data-key="${d.key}" title="Buka Dashboard">&#9654;</button>
        <button class="btn-icon btn-remove-dev" data-id="${d.id}" title="Hapus">&times;</button>
      </div>
    </div>`;
  }).join("");

  list.querySelectorAll(".btn-login-dev").forEach(btn => {
    btn.addEventListener("click", () => {
      const dev = loginDevice(btn.dataset.id, btn.dataset.key);
      if (dev) goToDash(dev);
    });
  });

  list.querySelectorAll(".btn-remove-dev").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!confirm("Hapus perangkat ini?")) return;
      removeUserDevice(btn.dataset.id);
      const active = getActiveDevice();
      if (active && active.id === btn.dataset.id) {
        sessionStorage.removeItem("sf_active_device");
      }
      renderDeviceList();
    });
  });
}

function setV(el, v, d) { $(el).textContent = v != null ? Number(v).toFixed(d) : "--"; }

/* ─────────── NUTRIENT STATUS ─────────── */
function updateRangeLabels() {
  const th = getCurrentThreshold();
  const cropLabel = th.label;
  $("rangeN").textContent  = `Optimal ${cropLabel}: ${th.N.low}–${th.N.high} ${th.N.unit}`;
  $("rangeP").textContent  = `Optimal ${cropLabel}: ${th.P.low}–${th.P.high} ${th.P.unit}`;
  $("rangeK").textContent  = `Optimal ${cropLabel}: ${th.K.low}–${th.K.high} ${th.K.unit}`;
  $("rangePH").textContent = `Optimal ${cropLabel}: ${th.PH.low}–${th.PH.high}`;
  $("rangeEC").textContent = `Optimal ${cropLabel}: ${th.EC.low}–${th.EC.high} ${th.EC.unit}`;
}

function getNutrientStatus(val, key) {
  const t = getCurrentThreshold()[key];
  if (val < t.low)  return { label: "Rendah",  cls: "rendah"  };
  if (val > t.high) return { label: "Tinggi",  cls: "tinggi"  };
  return               { label: "Optimal", cls: "optimal" };
}

function updateNutrients(last) {
  const fields = [
    { key: "N",  val: last.nitrogen, elVal: "vN",  elBar: "barN", elSt: "stN"  },
    { key: "P",  val: last.fosfor,   elVal: "vP",  elBar: "barP", elSt: "stP"  },
    { key: "K",  val: last.kalium,   elVal: "vK",  elBar: "barK", elSt: "stK"  },
    { key: "PH", val: last.ph,       elVal: "vPH", elBar: null,   elSt: "stPH" },
    { key: "EC", val: last.ec,       elVal: "vEC", elBar: null,   elSt: "stEC" }
  ];

  fields.forEach(({ key, val, elVal, elBar, elSt }) => {
    if (val == null) return;
    const t   = getCurrentThreshold()[key];
    const st  = getNutrientStatus(val, key);
    const dec = (key === "PH" || key === "EC") ? 1 : 0;

    $(elVal).textContent = Number(val).toFixed(dec);
    const stEl = $(elSt);
    stEl.textContent = st.label;
    stEl.className = "npk-status " + st.cls;

    if (elBar) {
      const pct = Math.min((val / t.barMax) * 100, 100).toFixed(1);
      const bar = $(elBar);
      bar.style.width = pct + "%";
      bar.style.background = t.color;
    }
  });

  updateRekomendasi(last);
}

/* ─────────── REKOMENDASI OTOMATIS ─────────── */
function updateRekomendasi(d) {
  const msgs = [];
  const th = getCurrentThreshold();

  if (d.nitrogen != null) {
    if (d.nitrogen < th.N.low)  msgs.push("Nitrogen rendah — tambahkan pupuk Urea atau ZA.");
    if (d.nitrogen > th.N.high) msgs.push("Nitrogen terlalu tinggi — kurangi dosis pupuk N, risiko rebah (lodging) meningkat.");
  }
  if (d.fosfor != null) {
    if (d.fosfor < th.P.low)  msgs.push("Fosfor rendah — aplikasikan SP-36 atau TSP sebelum masa tanam/anakan.");
    if (d.fosfor > th.P.high) msgs.push("Fosfor berlebih — tunda pemupukan P pada musim ini.");
  }
  if (d.kalium != null) {
    if (d.kalium < th.K.low)  msgs.push("Kalium rendah — tambahkan KCl pada fase anakan aktif.");
    if (d.kalium > th.K.high) msgs.push("Kalium terlalu tinggi — hentikan pemupukan K sementara.");
  }
  if (d.ph != null) {
    if (d.ph < th.PH.low) msgs.push("pH terlalu asam — pertimbangkan pengapuran dengan dolomit atau kapur pertanian.");
    if (d.ph > th.PH.high) msgs.push("pH terlalu basa — lakukan pengairan intensif atau tambahkan sulfur.");
  }
  if (d.ec != null && d.ec > th.EC.high) {
    msgs.push("EC tinggi — indikasi salinitas berlebih, lakukan pencucian tanah.");
  }

  const panel = $("rekomPanel");
  const text  = $("rekomText");
  if (!panel) return;

  if (msgs.length === 0) {
    panel.style.display = "none";
  } else {
    panel.style.display = "flex";
    text.innerHTML = msgs.map(m => "• " + m).join("<br>");
  }
}

/* ─────────── LOAD DASHBOARD ─────────── */
function load() {
  const dev = getActiveDevice();
  if (!dev) return;
  if (!$('ch1')) return;
  const all  = getData(dev.id);
  const data = filter(all, curRange);
  if (!data.length) return;

  const last = data[data.length - 1];

  setV("vTemp",  last.temp,  1);
  setV("vHum",   last.hum,   1);
  setV("vSoil",  last.soil,  0);
  setV("vLight", last.light, 0);

  updateRangeLabels();
  updateNutrients(last);

  const labels = data.map(d => {
    const t = new Date(d.ts);
    return t.toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit" });
  });
  const temps = data.map(d => d.temp);
  const hums  = data.map(d => d.hum);
  const soils = data.map(d => d.soil);
  const lits  = data.map(d => d.light);
  const dataN = data.map(d => d.nitrogen);
  const dataP = data.map(d => d.fosfor);
  const dataK = data.map(d => d.kalium);

  const isMobile = window.innerWidth <= 768;
  const isSmall  = window.innerWidth <= 480;

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: { intersect: false, mode: "index" },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: isSmall ? 8 : 12,
          padding: isSmall ? 8 : 14,
          font: { size: isSmall ? 10 : 11 }
        }
      },
      tooltip: {
        titleFont: { size: isSmall ? 11 : 12 },
        bodyFont: { size: isSmall ? 10 : 11 },
        padding: isSmall ? 8 : 12
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxTicksLimit: isSmall ? 5 : isMobile ? 7 : 10,
          font: { size: isSmall ? 9 : 10 },
          maxRotation: isSmall ? 45 : 0
        }
      }
    }
  };

  if (c1) c1.destroy();
  c1 = new Chart($("ch1"), {
    type: "line",
    data: { labels, datasets: [
      { label: "Suhu",      data: temps, borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,.08)",   borderWidth: isSmall ? 1.5 : 2, pointRadius: 0, tension: .3, yAxisID: "y"  },
      { label: "Kelembaban", data: hums, borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,.08)",  borderWidth: isSmall ? 1.5 : 2, pointRadius: 0, tension: .3, yAxisID: "y1" }
    ]},
    options: { ...baseOpts, scales: { ...baseOpts.scales,
      y:  { type: "linear", position: "left",  title: { display: true, text: "°C", font: { size: isSmall ? 10 : 11 } }, ticks: { font: { size: isSmall ? 9 : 10 } } },
      y1: { type: "linear", position: "right", title: { display: !isSmall, text: "%",  font: { size: isSmall ? 10 : 11 } }, grid: { drawOnChartArea: false }, ticks: { font: { size: isSmall ? 9 : 10 } } }
    }}
  });

  if (c2) c2.destroy();
  c2 = new Chart($("ch2"), {
    type: "line",
    data: { labels, datasets: [
      { label: "Tanah",  data: soils, borderColor: "#16a34a", backgroundColor: "rgba(22,163,74,.08)",   borderWidth: isSmall ? 1.5 : 2, pointRadius: 0, tension: .3, yAxisID: "y"  },
      { label: "Cahaya", data: lits,  borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,.08)",  borderWidth: isSmall ? 1.5 : 2, pointRadius: 0, tension: .3, yAxisID: "y1" }
    ]},
    options: { ...baseOpts, scales: { ...baseOpts.scales,
      y:  { type: "linear", position: "left",  title: { display: true, text: "%",   font: { size: isSmall ? 10 : 11 } }, ticks: { font: { size: isSmall ? 9 : 10 } } },
      y1: { type: "linear", position: "right", title: { display: !isSmall, text: "lux", font: { size: isSmall ? 10 : 11 } }, grid: { drawOnChartArea: false }, ticks: { font: { size: isSmall ? 9 : 10 } } }
    }}
  });

  if (c3) c3.destroy();
  c3 = new Chart($("ch3"), {
    type: "line",
    data: { labels, datasets: [
      { label: "N (mg/kg)", data: dataN, borderColor: "#639922", backgroundColor: "rgba(99,153,34,.08)",  borderWidth: isSmall ? 1.5 : 2, pointRadius: 0, tension: .3 },
      { label: "P (mg/kg)", data: dataP, borderColor: "#1D9E75", backgroundColor: "rgba(29,158,117,.08)", borderWidth: isSmall ? 1.5 : 2, pointRadius: 0, tension: .3 },
      { label: "K (mg/kg)", data: dataK, borderColor: "#378ADD", backgroundColor: "rgba(55,138,221,.08)", borderWidth: isSmall ? 1.5 : 2, pointRadius: 0, tension: .3 }
    ]},
    options: { ...baseOpts, scales: { ...baseOpts.scales,
      y: { type: "linear", title: { display: true, text: "mg/kg", font: { size: isSmall ? 10 : 11 } }, ticks: { font: { size: isSmall ? 9 : 10 } } }
    }}
  });

  const rows = [...data].reverse().slice(0, 20);
  $("tbody").innerHTML = rows.map(d => {
    const t = new Date(d.ts);
    return `<tr>
      <td>${t.toLocaleString("id-ID")}</td>
      <td>${d.temp?.toFixed(1) ?? "-"}</td>
      <td>${d.hum?.toFixed(1)  ?? "-"}</td>
      <td>${d.soil             ?? "-"}</td>
      <td>${d.light            ?? "-"}</td>
      <td>${d.nitrogen         ?? "-"}</td>
      <td>${d.fosfor           ?? "-"}</td>
      <td>${d.kalium           ?? "-"}</td>
      <td>${d.ph?.toFixed(1)   ?? "-"}</td>
      <td>${d.ec?.toFixed(2)   ?? "-"}</td>
    </tr>`;
  }).join("");
}

/* ─────────── EVENTS ─────────── */
window.addEventListener("DOMContentLoaded", () => {
  const hasLogin = !!$('loginScreen');
  const hasDash  = !!$('dashScreen');
  const hasAccount = !!$('accountScreen');

  const logged = getLoggedInUser();
  const active = getActiveDevice();

  /* ════════════ INDEX.HTML (Login + Dashboard) ════════════ */
  if (hasLogin && hasDash) {
    if (active) {
      displayDash(active);
    } else if (logged) {
      goToAccount();
    }

    /* ── Toggle Guest / Login / Register ── */
    function switchTab(tab) {
      ["tabGuest", "tabLogin", "tabRegister"].forEach(id => $(id).classList.remove("active"));
      $("guestForm").style.display = "none";
      $("loginForm").style.display = "none";
      $("registerForm").style.display = "none";
      $("guestErr").textContent = "";
      $("loginErr").textContent = "";
      $("registerErr").textContent = "";
      if (tab === "guest") {
        $("tabGuest").classList.add("active");
        $("guestForm").style.display = "block";
      } else if (tab === "login") {
        $("tabLogin").classList.add("active");
        $("loginForm").style.display = "block";
      } else {
        $("tabRegister").classList.add("active");
        $("registerForm").style.display = "block";
      }
    }

    $("tabGuest").addEventListener("click", () => switchTab("guest"));
    $("tabLogin").addEventListener("click", () => switchTab("login"));
    $("tabRegister").addEventListener("click", () => switchTab("register"));

    /* ── Guest Login ── */
    $("guestForm").addEventListener("submit", e => {
      e.preventDefault();
      const id   = $("deviceId").value.trim();
      const key  = $("apiKey").value.trim();
      const crop = $("cropType").value;
      const err  = $("guestErr");
      err.textContent = "";
      if (!id || !key) { err.textContent = "Isi semua kolom"; return; }
      const allDevices = getAllDevices();
      const dev = allDevices.find(d => d.id === id && d.key === key);
      if (!dev) { err.textContent = "Device ID atau API Key salah"; return; }
      const guestDev = { ...dev, crop, isGuest: true };
      sessionStorage.removeItem("sf_logged_user");
      setActiveDevice(guestDev);
      displayDash(guestDev);
    });

    /* ── Login ── */
    $("loginForm").addEventListener("submit", e => {
      e.preventDefault();
      const email = $("loginEmail").value.trim();
      const pass  = $("loginPass").value.trim();
      const err   = $("loginErr");
      err.textContent = "";
      if (!email || !pass) { err.textContent = "Isi semua kolom"; return; }
      const user = authUser(email, pass);
      if (!user) { err.textContent = "Email atau password salah"; return; }
      setLoggedInUser(user);
      if (user.devices.length === 0) {
        goToAccount();
      } else if (user.devices.length === 1) {
        setActiveDevice(user.devices[0]);
        displayDash(user.devices[0]);
      } else {
        goToAccount();
      }
    });

    /* ── Register ── */
    $("registerForm").addEventListener("submit", e => {
      e.preventDefault();
      const name  = $("regName").value.trim();
      const email = $("regEmail").value.trim();
      const pass  = $("regPass").value.trim();
      const err   = $("registerErr");
      err.textContent = "";
      if (!name || !email || !pass) { err.textContent = "Isi semua kolom"; return; }
      if (pass.length < 4) { err.textContent = "Password minimal 4 karakter"; return; }
      const ok = registerUser(name, email, pass);
      if (!ok) { err.textContent = "Email sudah terdaftar"; return; }
      $("registerForm").reset();
      $("tabLogin").click();
      $("loginErr").textContent = "Pendaftaran berhasil! Silakan masuk.";
    });

    /* ── Logout ── */
    $("logoutBtn").addEventListener("click", () => { logoutUser(); displayLogin(); });

    /* ── Save ── */
    $("saveBtn").addEventListener("click", () => {
      const dev = getActiveDevice();
      if (!dev) { displayLogin(); return; }
      if (dev.isGuest) {
        const user = getLoggedInUser();
        if (!user) {
          switchTab("login");
          displayLogin();
          $("loginErr").textContent = "Silakan masuk atau daftar untuk menyimpan data.";
          return;
        }
      }
      const user = getLoggedInUser();
      if (user) {
        addUserDevice(dev.id, dev.key, dev.name, dev.crop || getCrop());
      }
      const all = getData(dev.id);
      if (!all.length) return;
      const last = all[all.length - 1];
      addDataPoint(dev.id, last.temp, last.hum, last.soil, last.light, last.nitrogen, last.fosfor, last.kalium, last.ph, last.ec);
      load();
      const btn = $("saveBtn");
      btn.textContent = "Tersimpan!";
      setTimeout(() => { btn.textContent = "Simpan"; }, 1500);
    });

    /* ── Account ── */
    $("accountBtn").addEventListener("click", () => {
      const user = getLoggedInUser();
      if (!user) {
        switchTab("login");
        displayLogin();
        $("loginErr").textContent = "Silakan masuk untuk mengakses akun.";
        return;
      }
      goToAccount();
    });

    /* ── Range buttons ── */
    document.querySelectorAll(".r-btn").forEach(btn => btn.addEventListener("click", function () {
      document.querySelectorAll(".r-btn").forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      curRange = this.dataset.range;
      load();
    }));

    /* ── Resize: reload charts on breakpoint change ── */
    let lastBreakpoint = window.innerWidth <= 480 ? "sm" : window.innerWidth <= 768 ? "md" : "lg";
    window.addEventListener("resize", () => {
      const bp = window.innerWidth <= 480 ? "sm" : window.innerWidth <= 768 ? "md" : "lg";
      if (bp !== lastBreakpoint) {
        lastBreakpoint = bp;
        if (getActiveDevice()) load();
      }
    });
  }

  /* ════════════ AKUN.HTML (Account) ════════════ */
  if (hasAccount) {
    if (!logged) {
      goToLogin();
      return;
    }
    displayAccount();

    /* ── Back to Dashboard ── */
    $("backDashBtn").addEventListener("click", () => {
      const dev = getActiveDevice();
      if (dev) goToDash(dev);
      else goToLogin();
    });

    /* ── Add Device Modal ── */
    $("addDeviceBtn").addEventListener("click", () => {
      $("addDeviceModal").style.display = "flex";
      $("addDeviceErr").textContent = "";
      $("addDeviceForm").reset();
    });

    $("closeModalBtn").addEventListener("click", () => {
      $("addDeviceModal").style.display = "none";
    });

    $("addDeviceModal").addEventListener("click", e => {
      if (e.target === $("addDeviceModal")) $("addDeviceModal").style.display = "none";
    });

    $("addDeviceForm").addEventListener("submit", e => {
      e.preventDefault();
      const id   = $("devId").value.trim();
      const key  = $("devKey").value.trim();
      const name = $("devNameInput").value.trim();
      const crop = $("devCrop").value;
      const err  = $("addDeviceErr");
      err.textContent = "";
      if (!id || !key || !name) { err.textContent = "Isi semua kolom"; return; }
      const ok = addUserDevice(id, key, name, crop);
      if (!ok) { err.textContent = "Device ID sudah terdaftar di akun Anda"; return; }
      $("addDeviceModal").style.display = "none";
      renderDeviceList();
    });
  }
});
