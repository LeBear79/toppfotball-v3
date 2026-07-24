// =========================================================
// TOPPFOTBALL v0.1.1
// Profil, turregistrering, XP, tilbakemelding og historikk
// =========================================================

const STORAGE_KEY = "toppfotball-v3-data";

const defaultData = {
  profile: {
    name: "",
    favoritePlayer: "",
    image: ""
  },
  trips: [],
  stats: {
    xp: 0,
    motor: 0,
    strength: 0,
    balance: 0,
    mindset: 0
  }
};

let appData = loadData();

document.addEventListener("DOMContentLoaded", () => {
  setDefaultDate();
  restoreProfileForm();
  renderAll();

  document
    .getElementById("profile-form")
    .addEventListener("submit", handleProfileSubmit);

  document
    .getElementById("trip-form")
    .addEventListener("submit", handleTripSubmit);
});

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultData);

    const parsed = JSON.parse(saved);

    return {
      profile: { ...defaultData.profile, ...(parsed.profile || {}) },
      trips: Array.isArray(parsed.trips) ? parsed.trips : [],
      stats: { ...defaultData.stats, ...(parsed.stats || {}) }
    };
  } catch (error) {
    console.error("Kunne ikke lese lagrede data:", error);
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function setDefaultDate() {
  const dateInput = document.getElementById("trip-date");
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
}

function restoreProfileForm() {
  document.getElementById("profile-name").value = appData.profile.name;
  document.getElementById("favorite-player").value =
    appData.profile.favoritePlayer;
}

function handleProfileSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("profile-name").value.trim();
  const favoritePlayer = document
    .getElementById("favorite-player")
    .value.trim();
  const imageFile = document.getElementById("profile-image").files[0];

  const finishSaving = (imageData = appData.profile.image) => {
    appData.profile = {
      name,
      favoritePlayer,
      image: imageData
    };

    saveData();
    renderAll();
    showTemporaryButtonText(
      event.submitter,
      "Profil lagret",
      "Lagre profil"
    );
  };

  if (imageFile) {
    if (!imageFile.type.startsWith("image/")) {
      alert("Velg en bildefil.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => finishSaving(reader.result);
    reader.onerror = () => alert("Bildet kunne ikke leses.");
    reader.readAsDataURL(imageFile);
  } else {
    finishSaving();
  }
}

function handleTripSubmit(event) {
  event.preventDefault();

  const trip = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()),
    name: document.getElementById("trip-name").value.trim(),
    date: document.getElementById("trip-date").value,
    distance: Number(document.getElementById("trip-distance").value),
    elevation: Number(document.getElementById("trip-elevation").value),
    speed: Number(document.getElementById("trip-speed").value),
    effort: Number(document.getElementById("trip-effort").value),
    newPeak:
      document.getElementById("trip-new-peak").value === "ja"
  };

  if (
    !trip.name ||
    !trip.date ||
    !Number.isFinite(trip.distance) ||
    trip.distance <= 0 ||
    !Number.isFinite(trip.elevation) ||
    trip.elevation < 0 ||
    !Number.isFinite(trip.speed) ||
    trip.speed <= 0
  ) {
    alert("Kontroller at alle feltene er riktig fylt ut.");
    return;
  }

  const gains = calculateGains(trip);
  const xp = calculateXp(trip, gains);

  trip.gains = gains;
  trip.xp = xp;
  trip.feedback = createFeedback(trip, gains, xp);

  appData.trips.unshift(trip);
  appData.stats.xp += xp;
  appData.stats.motor += gains.motor;
  appData.stats.strength += gains.strength;
  appData.stats.balance += gains.balance;
  appData.stats.mindset += gains.mindset;

  saveData();
  renderAll();
  renderFeedback(trip);

  event.target.reset();
  setDefaultDate();

  document
    .getElementById("feedback-section")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

function calculateGains(trip) {
  const motor = clamp(
    Math.round(trip.distance / 2 + trip.speed / 4),
    1,
    8
  );

  const strength = clamp(
    Math.round(trip.elevation / 120 + trip.effort / 2),
    1,
    8
  );

  const balance = clamp(
    Math.round(trip.elevation / 220 + (trip.newPeak ? 2 : 0)),
    1,
    6
  );

  const mindset = clamp(
    Math.round(trip.effort + (trip.newPeak ? 1 : 0)),
    1,
    7
  );

  return { motor, strength, balance, mindset };
}

function calculateXp(trip, gains) {
  const base =
    trip.distance * 8 +
    trip.elevation * 0.08 +
    trip.effort * 7 +
    (trip.newPeak ? 20 : 0);

  const developmentBonus =
    gains.motor +
    gains.strength +
    gains.balance +
    gains.mindset;

  return Math.max(10, Math.round(base + developmentBonus));
}

function createFeedback(trip, gains, xp) {
  const name = appData.profile.name || "spiller";
  const strongestSkills = getStrongestSkills(gains);

  const intro =
    trip.effort >= 5
      ? "Du presset deg skikkelig i denne økten."
      : trip.effort >= 4
        ? "Dette var en krevende og solid økt."
        : trip.distance >= 5
          ? "Dette var en god utholdenhetsøkt."
          : "Dette var en nyttig økt med god treningsverdi.";

  const elevationText =
    trip.elevation >= 300
      ? `${trip.elevation} høydemeter ga beina en skikkelig arbeidsøkt.`
      : trip.elevation >= 100
        ? `${trip.elevation} høydemeter ga god trening for styrke og stabilitet.`
        : "Turen ga et godt grunnlag for videre utvikling.";

  const peakText = trip.newPeak
    ? "At du nådde en ny topp viser også mot og evne til å holde ut når det blir krevende."
    : "";

  const transferText = strongestSkills
    .map((skill) => skill.transfer)
    .join(" ");

  return `${intro} ${elevationText} ${peakText} ${transferText} Du fikk ${xp} XP.`;
}

function getStrongestSkills(gains) {
  const skillInfo = {
    motor: {
      label: "motor",
      transfer:
        "Bedre motor gjør det lettere å holde høy intensitet gjennom hele kampen, ta flere løp og fortsatt ha overskudd mot slutten."
    },
    strength: {
      label: "beinstyrke",
      transfer:
        "Økt beinstyrke gir bedre kraft i sprint, skudd og retningsforandringer, og gjør deg sterkere i dueller."
    },
    balance: {
      label: "balanse",
      transfer:
        "Bedre balanse hjelper deg med å holde kontroll på kroppen i vendinger, finter, taklinger og når du tar imot ballen under press."
    },
    mindset: {
      label: "viljestyrke",
      transfer:
        "Sterkere viljestyrke gjør det lettere å fortsette å jobbe, holde konsentrasjonen og ta gode valg når du begynner å bli sliten."
    }
  };

  const sorted = Object.entries(gains).sort((a, b) => b[1] - a[1]);
  const highest = sorted[0][1];

  return sorted
    .filter(([, value]) => value >= highest - 1)
    .slice(0, 2)
    .map(([key]) => skillInfo[key]);
}

function renderAll() {
  renderProfile();
  renderDashboard();
  renderHistory();

  if (appData.trips.length > 0) {
    renderFeedback(appData.trips[0]);
  } else {
    renderEmptyFeedback();
  }
}

function renderProfile() {
  const name = appData.profile.name || "";
  document.getElementById("welcome-heading").textContent =
    name ? `Hei, ${name}!` : "Hei!";
}

function renderDashboard() {
  const totals = getTotals();
  const levelInfo = getLevelInfo(appData.stats.xp);

  document.getElementById("level-value").textContent =
    levelInfo.level;
  document.getElementById("level-progress-text").textContent =
    `${levelInfo.currentXp} av ${levelInfo.requiredXp} XP`;
  document.getElementById("level-progress-percent").textContent =
    `${levelInfo.percent} %`;

  setProgress(
    "level-progress-fill",
    levelInfo.percent
  );

  const levelTrack = document.querySelector(
    '#dashboard-section [role="progressbar"]'
  );
  levelTrack.setAttribute("aria-valuenow", levelInfo.percent);

  document.getElementById("level-progress-note").textContent =
    appData.trips.length
      ? `${levelInfo.remainingXp} XP igjen til nivå ${levelInfo.level + 1}.`
      : "Registrer den første turen for å starte utviklingen.";

  document.getElementById("total-distance").textContent =
    `${formatNumber(totals.distance, 1)} km`;
  document.getElementById("total-elevation").textContent =
    `${Math.round(totals.elevation)} hm`;
  document.getElementById("total-trips").textContent =
    String(totals.trips);
  document.getElementById("total-peaks").textContent =
    String(totals.peaks);

  renderGoal(
    "distance",
    totals.distance,
    nextMultipleGoal(totals.distance, 3, 3),
    "km",
    1
  );

  renderGoal(
    "elevation",
    totals.elevation,
    nextElevationGoal(totals.elevation),
    "hm",
    0
  );

  renderGoal(
    "trips",
    totals.trips,
    nextMultipleGoal(totals.trips, 2, 2),
    "turer",
    0
  );

  renderGoal(
    "peaks",
    totals.peaks,
    nextMultipleGoal(totals.peaks, 5, 5),
    "topper",
    0
  );
}

function getTotals() {
  return appData.trips.reduce(
    (total, trip) => {
      total.distance += Number(trip.distance) || 0;
      total.elevation += Number(trip.elevation) || 0;
      total.trips += 1;
      total.peaks += trip.newPeak ? 1 : 0;
      return total;
    },
    { distance: 0, elevation: 0, trips: 0, peaks: 0 }
  );
}

function getLevelInfo(totalXp) {
  const xpPerLevel = 500;
  const level = Math.floor(totalXp / xpPerLevel) + 1;
  const currentXp = totalXp % xpPerLevel;
  const percent = Math.round((currentXp / xpPerLevel) * 100);

  return {
    level,
    currentXp,
    requiredXp: xpPerLevel,
    percent,
    remainingXp: xpPerLevel - currentXp
  };
}

function nextMultipleGoal(value, interval, firstGoal) {
  if (value < firstGoal) return firstGoal;
  return (Math.floor(value / interval) + 1) * interval;
}

function nextElevationGoal(value) {
  if (value < 100) return 100;
  return 100 + (Math.floor((value - 100) / 150) + 1) * 150;
}

function renderGoal(prefix, value, goal, unit, decimals) {
  const previousGoal =
    prefix === "elevation"
      ? previousElevationGoal(goal)
      : Math.max(0, goal - goalInterval(prefix));

  const progress =
    goal === previousGoal
      ? 0
      : ((value - previousGoal) / (goal - previousGoal)) * 100;

  document.getElementById(`${prefix}-next`).textContent =
    `Neste mål: ${formatNumber(goal, decimals)} ${unit}`;

  setProgress(`${prefix}-progress-fill`, progress);
}

function previousElevationGoal(goal) {
  if (goal <= 100) return 0;
  return goal - 150;
}

function goalInterval(prefix) {
  const intervals = {
    distance: 3,
    trips: 2,
    peaks: 5
  };
  return intervals[prefix] || 1;
}

function renderFeedback(trip) {
  const name = appData.profile.name || "spiller";
  document.getElementById("feedback-player").textContent =
    `Godt jobbet, ${name}!`;

  document.getElementById("feedback-text").textContent =
    trip.feedback || createFeedback(trip, trip.gains, trip.xp);

  document.getElementById("gain-motor").textContent =
    `+${trip.gains.motor}`;
  document.getElementById("gain-strength").textContent =
    `+${trip.gains.strength}`;
  document.getElementById("gain-balance").textContent =
    `+${trip.gains.balance}`;
  document.getElementById("gain-mindset").textContent =
    `+${trip.gains.mindset}`;
}

function renderEmptyFeedback() {
  const name = appData.profile.name || "spiller";
  document.getElementById("feedback-player").textContent =
    appData.profile.name
      ? `Klar for neste økt, ${name}?`
      : "Registrer profilen din først.";

  document.getElementById("feedback-text").textContent =
    "Når du registrerer en tur, får du en tilbakemelding som er tilpasset lengde, høydemeter, fart og innsats.";

  ["motor", "strength", "balance", "mindset"].forEach((key) => {
    document.getElementById(`gain-${key}`).textContent = "+0";
  });
}

function renderHistory() {
  const body = document.getElementById("trip-history-body");

  if (appData.trips.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="6">Ingen turer registrert ennå.</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = appData.trips
    .map(
      (trip) => `
        <tr>
          <td>${escapeHtml(formatDate(trip.date))}</td>
          <td>${escapeHtml(trip.name)}</td>
          <td>${formatNumber(trip.distance, 1)}</td>
          <td>${Math.round(trip.elevation)}</td>
          <td>${formatNumber(trip.speed, 1)} km/t</td>
          <td>${trip.effort}/5</td>
        </tr>
      `
    )
    .join("");
}

function setProgress(id, value) {
  const element = document.getElementById(id);
  element.style.width = `${clamp(Number(value) || 0, 0, 100)}%`;
}

function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat("nb-NO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("nb-NO").format(
    new Date(`${dateString}T12:00:00`)
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showTemporaryButtonText(button, temporaryText, normalText) {
  if (!button) return;

  button.textContent = temporaryText;
  button.disabled = true;

  window.setTimeout(() => {
    button.textContent = normalText;
    button.disabled = false;
  }, 1200);
}
