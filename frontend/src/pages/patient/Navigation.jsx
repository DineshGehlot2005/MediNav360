import { useEffect, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";
import HospitalMap from "../../components/HospitalMap.jsx";

const NODES = [
  "Entrance",
  "Reception",
  "Main Corridor",
  "Elevator",
  "Pharmacy",
  "General Medicine",
  "Dermatology",
  "ENT",
  "Cardiology",
  "Orthopedics",
  "Neurology",
];

// Node → Floor mapping (seed.py ke hisaab se)
const NODE_FLOORS = {
  Entrance: "Ground",
  Reception: "Ground",
  "Main Corridor": "Ground",
  Elevator: "Ground",
  Pharmacy: "Ground",
  "General Medicine": "First",
  Dermatology: "First",
  ENT: "First",
  Cardiology: "Second",
  Orthopedics: "Second",
  Neurology: "Second",
};

// Turn-by-turn directions generate karo
function buildDirections(path) {
  if (!path || path.length < 2) return [];
  const steps = [];
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    let label;
    if (i === 0) {
      label = `Start at ${from}, head towards ${to}`;
    } else if (i === path.length - 2) {
      label = `Arrive at your destination: ${to}`;
    } else {
      label = `Continue to ${to}`;
    }
    steps.push({ step: i + 1, from, to, label });
  }
  return steps;
}

// Distance + time format karo
function formatDistance(meters) {
  if (!meters && meters !== 0) return "—";
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatTime(minutes) {
  if (!minutes && minutes !== 0) return "—";
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `~${seconds} sec`;
  }
  return `~${minutes} min`;
}

export default function PatientNavigation({ initialDestination = "" }) {
  const [source, setSource] = useState("Entrance");
  const [dest, setDest] = useState("Cardiology");
  const [mode, setMode] = useState("normal");
  const [route, setRoute] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Jab initialDestination aaye (AI se), set karo
  useEffect(() => {
    if (initialDestination && NODES.includes(initialDestination)) {
      setDest(initialDestination);
    }
  }, [initialDestination]);

  // Source ya dest change hone pe purana route hata do
  useEffect(() => {
    setRoute(null);
    setError("");
  }, [source, dest, mode]);

  async function run() {
    setError("");
    setRoute(null);
    setLoading(true);
    try {
      const res = await api.shortestPath(source, dest, mode);
      setRoute(res);
    } catch (e) {
      setError(e.message || "Could not find a route. Try a different mode.");
    } finally {
      setLoading(false);
    }
  }

  function swapLocations() {
    setSource(dest);
    setDest(source);
  }

  const directions = route?.path ? buildDirections(route.path) : [];

  // Route mein jo floors involved hain
  const floorsInRoute = route?.path
    ? [...new Set(route.path.map((n) => NODE_FLOORS[n]).filter(Boolean))]
    : [];

  return (
    <div className="app-feature-page inner-page">
      <div className="feature-page-header">
        <div>
          <span className="feature-eyebrow">Wayfinding</span>
          <h1>Hospital Navigation</h1>
          <p>Find an accessible route between hospital locations.</p>
        </div>
        <div className="feature-round-icon">
          <Icon name="map" size={24} />
        </div>
      </div>

      {/* ===== TOP: Plan + Route Summary (2 columns) ===== */}
      <div className="navigation-layout">
        {/* Left: Plan your route */}
        <section className="feature-card">
          <div className="feature-card-title">
            <Icon name="map" size={18} />
            <h2>Plan your route</h2>
          </div>

          <div className="navigation-fields">
            <label>
              Starting point
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                {NODES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="swap-arrow"
              onClick={swapLocations}
              aria-label="Swap locations"
              title="Swap locations"
            >
              <Icon name="arrow" size={17} />
            </button>

            <label>
              Destination
              <select value={dest} onChange={(e) => setDest(e.target.value)}>
                {NODES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="route-mode-grid">
            {[
              ["normal", "Normal route", "Fastest general route"],
              ["wheelchair", "Wheelchair accessible", "Avoid inaccessible paths"],
              ["avoid_stairs", "Avoid stairs", "Prefer routes without stairs"],
            ].map(([v, t, d]) => (
              <button
                key={v}
                className={mode === v ? "selected" : ""}
                onClick={() => setMode(v)}
              >
                <span className="radio-dot" />
                <div>
                  <strong>{t}</strong>
                  <small>{d}</small>
                </div>
              </button>
            ))}
          </div>

          <button
            className="feature-primary full-action"
            onClick={run}
            disabled={loading || source === dest}
          >
            {loading ? (
              <>
                <span className="button-spinner" />
                Finding route...
              </>
            ) : (
              <>
                <Icon name="map" size={16} />
                Find Shortest Path
              </>
            )}
          </button>

          {source === dest && (
            <div className="feature-hint">
              Choose different start and destination locations.
            </div>
          )}

          {error && (
            <div className="feature-error">
              <Icon name="info" size={16} />
              {error}
            </div>
          )}
        </section>

        {/* Right: Route summary cards */}
        <aside className="feature-card route-summary-panel">
          <div className="feature-card-title">
            <Icon name="pin" size={18} />
            <h2>Route summary</h2>
            {floorsInRoute.length > 1 && (
              <span className="multi-floor-badge">
                {floorsInRoute.length} floors
              </span>
            )}
          </div>

          {route ? (
            <div className="route-summary">
              <div>
                <span>Distance</span>
                <strong>{formatDistance(route.distance)}</strong>
              </div>
              <div>
                <span>Estimated time</span>
                <strong>{formatTime(route.estimated_time_minutes)}</strong>
              </div>
              <div>
                <span>Mode</span>
                <strong>
                  {mode === "normal"
                    ? "Normal"
                    : mode === "wheelchair"
                    ? "Wheelchair"
                    : "No stairs"}
                </strong>
              </div>
            </div>
          ) : (
            <div className="feature-empty compact-empty">
              Select locations and click <strong>Find Shortest Path</strong> to
              see route details.
            </div>
          )}
        </aside>
      </div>

      {/* ===== FULL-WIDTH MAP (Hero Element) ===== */}
      <section className="feature-card map-full-card">
        <div className="feature-card-title">
          <Icon name="map" size={18} />
          <h2>Hospital map</h2>
          {source && dest && (
            <span className="map-route-label">
              {source} → {dest}
            </span>
          )}
        </div>

        <HospitalMap
          route={route}
          source={source}
          destination={dest}
          onNodeClick={(name) => {
            if (name !== source) setDest(name);
          }}
        />
      </section>

      {/* ===== Step-by-step directions ===== */}
      {route && directions.length > 0 && (
        <section className="feature-card directions-card">
          <div className="feature-card-title">
            <Icon name="list" size={18} />
            <h2>Step-by-step directions</h2>
          </div>

          <ol className="directions-list">
            {directions.map((dir) => (
              <li key={dir.step} className="direction-step">
                <div className="direction-step-number">{dir.step}</div>
                <div className="direction-step-copy">
                  <strong>{dir.label}</strong>
                  <span className="direction-step-meta">
                    {dir.from} → {dir.to}
                  </span>
                </div>
              </li>
            ))}
          </ol>

          <div className="directions-footer">
            <span>
              <Icon name="info" size={14} /> Follow the highlighted path on the
              map above.
            </span>
          </div>
        </section>
      )}
    </div>
  );
}