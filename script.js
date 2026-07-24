// =========================================================
// TOPPFOTBALL v0.1.4
// Flere brukere, bilder, turregistrering, XP og sletting
// =========================================================

const STORAGE_KEY = "toppfotball-v3-multi-profile";
const LEGACY_STORAGE_KEY = "toppfotball-v3-data";

const emptyStats = () => ({
  xp: 0,
  motor: 0,
  strength: 0,
  balance: 0,
  mindset: 0
});

const createProfile = (name = "") => ({
  id: makeId(),
  name,
  favoritePlayer: "",
  image: "",
  favoritePlayerImage: "",
  trips: [],
  stats: emptyStats()
});

let appData = loadData();

document.addEventListener("DOMContentLoaded", () => {
  ensureActiveProfile();
  setDefaultDate();
  bindEvents();
  renderAll();
});

function bindEvents() {
  const profileForm = document.getElementById("profile-form");
  const tripForm = document.getElementById("trip-form");
  const profileSelector = document.getElementById("profile-selector");
  const newProfileButton = document.getElementById("new-profile-button");
  const deleteProfileButton =
    document.getElementById("delete-profile-button");

  profileForm?.addEventListener("submit", handleProfileSubmit);
  tripForm?.addEventListener("submit", handleTripSubmit);
  profileSelector?.addEventListener("change", handleProfileSwitch);
  newProfileButton?.addEventListener("click", createNewProfile);
  deleteProfileButton?.addEventListener("click", deleteActiveProfile);
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.profiles)) {
        return parsed;
      }
    }

    const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacySaved) {
      const legacy = JSON.parse(legacySaved);
      const migrated = createProfile(legacy.profile?.name || "");
      migrated.favoritePlayer = legacy.profile?.favoritePlayer || "";
      migrated.image = legacy.profile?.image || "";
      migrated.favoritePlayerImage =
        legacy.profile?.favoritePlayerImage || "";
      migrated.trips = Array.isArray(legacy.trips) ? legacy.trips : [];
      migrated.stats = { ...emptyStats(), ...(legacy.stats || {}) };

      const data = {
        activeProfileId: migrated.id,
        profiles: [migrated]
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (error) {
    console.error("Kunne ikke lese lagrede data:", error);
  }

  const firstProfile = createProfile();
  return {
    activeProfileId: firstProfile.id,
    profiles: [firstProfile]
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function ensureActiveProfile() {
  if (!Array.isArray(appData.profiles) || appData.profiles.length === 0) {
    const profile = createProfile();
    appData.profiles = [profile];
    appData.activeProfileId = profile.id;
  }

  if (!appData.profiles.some((p) => p.id === appData.activeProfileId)) {
    appData.activeProfileId = appData.profiles[0].id;
  }
}

function getActiveProfile() {
  return appData.profiles.find(
    (profile) => profile.id === appData.activeProfileId
  );
}

function setDefaultDate() {
  const dateInput = document.getElementById("trip-date");
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
}

function handleProfileSwitch(event) {
  appData.activeProfileId = event.target.value;
  saveData();
  renderAll();
}

function createNewProfile() {
  const profile = createProfile();
  appData.profiles.push(profile);
  appData.activeProfileId = profile.id;
  saveData();
  renderAll();

  document.getElementById("profile-name").focus();
}

function deleteActiveProfile() {
  const profile = getActiveProfile();
  if (!profile) return;

  if (appData.profiles.length === 1) {
    alert("Du må ha minst én bruker.");
    return;
  }

  const label = profile.name || "denne brukeren";
  const confirmed = window.confirm(
    `Vil du slette ${label} og alle registrerte turer?`
  );

  if (!confirmed) return;

  appData.profiles = appData.profiles.filter(
    (item) => item.id !== profile.id
  );
  appData.activeProfileId = appData.profiles[0].id;
  saveData();
  renderAll();
}

function handleProfileSubmit(event) {
  event.preventDefault();

  const profile = getActiveProfile();
  if (!profile) return;

  const name = document.getElementById("profile-name").value.trim();
  const favoritePlayer =
    document.getElementById("favorite-player").value.trim();
  const profileImageInput =
    document.getElementById("profile-image");
  const playerImageInput =
    document.getElementById("favorite-player-image");

  const profileImageFile =
    profileImageInput?.files?.[0] || null;
  const playerImageFile =
    playerImageInput?.files?.[0] || null;

  const readImage = (file, fallback) =>
    new Promise((resolve, reject) => {
      if (!file) {
        resolve(fallback || "");
        return;
      }

      if (!file.type.startsWith("image/")) {
        reject(new Error("Velg bare bildefiler."));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () =>
        reject(new Error("Bildet kunne ikke leses."));
      reader.readAsDataURL(file);
    });

  Promise.all([
    readImage(profileImageFile, profile.image),
    readImage(playerImageFile, profile.favoritePlayerImage)
  ])
    .then(([profileImage, favoritePlayerImage]) => {
      profile.name = name;
      profile.favoritePlayer = favoritePlayer;
      profile.image = profileImage;
      profile.favoritePlayerImage = favoritePlayerImage;

      saveData();
      renderAll();

      showTemporaryButtonText(
        event.submitter,
        "Bruker lagret",
        "Lagre bruker"
      );
    })
    .catch((error) => alert(error.message));
}

function handleTripSubmit(event) {
  event.preventDefault();

  const profile = getActiveProfile();
  if (!profile) return;

  const trip = {
    id: makeId(),
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
  trip.feedback = createFeedback(profile, trip, gains, xp);

  profile.trips.unshift(trip);
  profile.stats.xp += xp;
  profile.stats.motor += gains.motor;
  profile.stats.strength += gains.strength;
  profile.stats.balance += gains.balance;
  profile.stats.mindset += gains.mindset;

  try {
    saveData();
    renderAll();

    event.target.reset();
    setDefaultDate();

    showTemporaryButtonText(
      event.submitter,
      "Tur registrert",
      "Registrer tur"
    );

    document
      .getElementById("feedback-section")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    console.error("Kunne ikke registrere turen:", error);
    alert("Turen kunne ikke registreres. Last siden på nytt og prøv igjen.");
  }
}

function calculateGains(trip) {
  return {
    motor: clamp(
      Math.round(trip.distance / 2 + trip.speed / 4),
      1,
      8
    ),
    strength: clamp(
      Math.round(trip.elevation / 120 + trip.effort / 2),
      1,
      8
    ),
    balance: clamp(
      Math.round(trip.elevation / 220 + (trip.newPeak ? 2 : 0)),
      1,
      6
    ),
    mindset: clamp(
      Math.round(trip.effort + (trip.newPeak ? 1 : 0)),
      1,
      7
    )
  };
}

function calculateXp(trip, gains) {
  const base =
    trip.distance * 8 +
    trip.elevation * 0.08 +
    trip.effort * 7 +
    (trip.newPeak ? 20 : 0);

  return Math.max(
    10,
    Math.round(
      base +
        gains.motor +
        gains.strength +
        gains.balance +
        gains.mindset
    )
  );
}

function createFeedback(profile, trip, gains, xp) {
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
      transfer:
        "Bedre motor gjør det lettere å holde høy intensitet gjennom hele kampen, ta flere løp og fortsatt ha overskudd mot slutten."
    },
    strength: {
      transfer:
        "Økt beinstyrke gir bedre kraft i sprint, skudd og retningsforandringer, og gjør deg sterkere i dueller."
    },
    balance: {
      transfer:
        "Bedre balanse hjelper deg med å holde kontroll på kroppen i vendinger, finter, taklinger og når du tar imot ballen under press."
    },
    mindset: {
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
  renderProfileSelector();
  restoreProfileForm();
  renderProfile();
  renderDashboard();
  renderHistory();

  const profile = getActiveProfile();
  if (profile.trips.length > 0) {
    renderFeedback(profile.trips[0]);
  } else {
    renderEmptyFeedback();
  }
}

function renderProfileSelector() {
  const selector = document.getElementById("profile-selector");

  selector.innerHTML = appData.profiles
    .map((profile, index) => {
      const label = profile.name || `Ny bruker ${index + 1}`;
      return `
        <option value="${escapeHtml(profile.id)}">
          ${escapeHtml(label)}
        </option>
      `;
    })
    .join("");

  selector.value = appData.activeProfileId;
}

function restoreProfileForm() {
  const profile = getActiveProfile();

  document.getElementById("profile-name").value = profile.name;
  document.getElementById("favorite-player").value =
    profile.favoritePlayer;
  const profileImageInput = document.getElementById("profile-image");
  const playerImageInput =
    document.getElementById("favorite-player-image");

  if (profileImageInput) profileImageInput.value = "";
  if (playerImageInput) playerImageInput.value = "";
}

function renderProfile() {
  const profile = getActiveProfile();
  const name = profile.name || "";

  document.getElementById("welcome-heading").textContent =
    name ? `Hei, ${name}!` : "Hei!";

  document.getElementById("profile-summary-name").textContent =
    name || "Ny bruker";

  document.getElementById("profile-summary-player").textContent =
    profile.favoritePlayer || "Ikke valgt";

  renderCircleImage(
    "profile-avatar",
    "profile-avatar-placeholder",
    profile.image,
    getInitials(name) || "TF"
  );

  renderCircleImage(
    "profile-player-avatar",
    "profile-player-placeholder",
    profile.favoritePlayerImage,
    profile.favoritePlayer
      ? getInitials(profile.favoritePlayer)
      : "10"
  );
}

function renderCircleImage(imageId, placeholderId, source, fallback) {
  const image = document.getElementById(imageId);
  const placeholder = document.getElementById(placeholderId);

  if (source) {
    image.src = source;
    image.hidden = false;
    placeholder.hidden = true;
  } else {
    image.hidden = true;
    placeholder.hidden = false;
    placeholder.textContent = fallback;
  }
}

function renderDashboard() {
  const profile = getActiveProfile();
  const totals = getTotals(profile);
  const levelInfo = getLevelInfo(profile.stats.xp);

  document.getElementById("level-value").textContent =
    levelInfo.level;
  document.getElementById("level-progress-text").textContent =
    `${levelInfo.currentXp} av ${levelInfo.requiredXp} XP`;
  document.getElementById("level-progress-percent").textContent =
    `${levelInfo.percent} %`;

  setProgress("level-progress-fill", levelInfo.percent);

  const levelTrack = document.querySelector(
    '#dashboard-section [role="progressbar"]'
  );
  levelTrack.setAttribute("aria-valuenow", levelInfo.percent);

  document.getElementById("level-progress-note").textContent =
    profile.trips.length
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

function getTotals(profile) {
  return profile.trips.reduce(
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
  const progress = goal > 0 ? (value / goal) * 100 : 0;

  document.getElementById(`${prefix}-next`).textContent =
    `Neste mål: ${formatNumber(goal, decimals)} ${unit}`;

  setProgress(`${prefix}-progress-fill`, progress);
}

function renderFeedback(trip) {
  const profile = getActiveProfile();
  const name = profile.name || "spiller";

  document.getElementById("feedback-player").textContent =
    `Godt jobbet, ${name}!`;
  document.getElementById("feedback-text").textContent =
    trip.feedback ||
    createFeedback(profile, trip, trip.gains, trip.xp);

  document.getElementById("gain-motor").textContent =
    `+${trip.gains.motor}`;
  document.getElementById("gain-strength").textContent =
    `+${trip.gains.strength}`;
  document.getElementById("gain-balance").textContent =
    `+${trip.gains.balance}`;
  document.getElementById("gain-mindset").textContent =
    `+${trip.gains.mindset}`;

  renderFavoritePlayerImage(profile);
}

function renderEmptyFeedback() {
  const profile = getActiveProfile();
  const name = profile.name || "spiller";

  document.getElementById("feedback-player").textContent =
    profile.name
      ? `Klar for første økt, ${name}?`
      : "Registrer brukeren først.";

  document.getElementById("feedback-text").textContent =
    "Når du registrerer en tur, får du en tilbakemelding som forklarer hvordan treningen kan hjelpe deg på fotballbanen.";

  ["motor", "strength", "balance", "mindset"].forEach((key) => {
    document.getElementById(`gain-${key}`).textContent = "+0";
  });

  renderFavoritePlayerImage(profile);
}

function renderFavoritePlayerImage(profile) {
  const wrap = document.getElementById("feedback-image-wrap");
  const image = document.getElementById("feedback-player-image");

  if (profile.favoritePlayerImage) {
    image.src = profile.favoritePlayerImage;
    image.alt = profile.favoritePlayer
      ? `Bilde av ${profile.favoritePlayer}`
      : "Bilde av favorittspiller";
    wrap.hidden = false;
  } else {
    image.removeAttribute("src");
    wrap.hidden = true;
  }
}

function renderHistory() {
  const profile = getActiveProfile();
  const body = document.getElementById("trip-history-body");

  if (profile.trips.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="7">Ingen turer registrert ennå.</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = profile.trips
    .map(
      (trip) => `
        <tr>
          <td>${escapeHtml(formatDate(trip.date))}</td>
          <td>${escapeHtml(trip.name)}</td>
          <td>${formatNumber(trip.distance, 1)}</td>
          <td>${Math.round(trip.elevation)}</td>
          <td>${formatNumber(trip.speed, 1)} km/t</td>
          <td>${trip.effort}/5</td>
          <td>
            <button
              type="button"
              class="delete-trip-button"
              data-trip-id="${escapeHtml(trip.id)}"
            >
              Slett
            </button>
          </td>
        </tr>
      `
    )
    .join("");

  body.querySelectorAll(".delete-trip-button").forEach((button) => {
    button.addEventListener("click", () =>
      deleteTrip(button.dataset.tripId)
    );
  });
}

function deleteTrip(tripId) {
  const profile = getActiveProfile();
  const trip = profile.trips.find((item) => item.id === tripId);
  if (!trip) return;

  const confirmed = window.confirm(
    `Vil du slette turen "${trip.name}"?`
  );
  if (!confirmed) return;

  profile.trips = profile.trips.filter(
    (item) => item.id !== tripId
  );
  recalculateStats(profile);
  saveData();
  renderAll();
}

function recalculateStats(profile) {
  profile.stats = emptyStats();

  profile.trips.forEach((trip) => {
    profile.stats.xp += Number(trip.xp) || 0;
    profile.stats.motor += Number(trip.gains?.motor) || 0;
    profile.stats.strength += Number(trip.gains?.strength) || 0;
    profile.stats.balance += Number(trip.gains?.balance) || 0;
    profile.stats.mindset += Number(trip.gains?.mindset) || 0;
  });
}

function setProgress(id, value) {
  const element = document.getElementById(id);
  element.style.width =
    `${clamp(Number(value) || 0, 0, 100)}%`;
}

function getInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
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

function makeId() {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showTemporaryButtonText(
  button,
  temporaryText,
  normalText
) {
  if (!button) return;

  button.textContent = temporaryText;
  button.disabled = true;

  window.setTimeout(() => {
    button.textContent = normalText;
    button.disabled = false;
  }, 1200);
}
