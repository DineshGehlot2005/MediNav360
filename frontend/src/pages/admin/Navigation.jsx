import { useEffect, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";
import QRCodeCard from "../../components/QRCodeCard.jsx";

const FALLBACK_NODES = [
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

export default function AdminNavigation() {
  const [nodes, setNodes] = useState(FALLBACK_NODES);
  const [source, setSource] = useState("Entrance");
  const [destination, setDestination] = useState("Cardiology");
  const [mode, setMode] = useState("normal");
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    api
      .adminNavigationNodes()
      .then((r) => setNodes(r.nodes?.length ? r.nodes : FALLBACK_NODES))
      .catch(() => {});
  }, []);

  async function getRoute() {
    setLoading(true);
    setError("");
    setRoute(null);
    try {
      setRoute(await api.shortestPath(source, destination, mode));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-list-page">
      {/* ===== HEADER ===== */}
      <div className="admin-list-header">
        <div>
          <div className="admin-breadcrumb">Admin / Hospital Navigation</div>
          <h1>
            <Icon name="map" size={26} />
            Hospital Navigation
          </h1>
          <p>
            Preview accessible routes and generate QR codes for hospital
            locations.
          </p>
        </div>
        <button
          type="button"
          className={showQR ? "feature-primary" : "feature-secondary"}
          onClick={() => setShowQR(!showQR)}
        >
          <Icon name="grid" size={16} />
          {showQR ? "Hide QR Codes" : "Show QR Codes"}
        </button>
      </div>

      {/* ===== QR CODE SECTION ===== */}
      {showQR && (
        <section className="feature-card qr-section">
          <div className="feature-card-title">
            <Icon name="grid" size={18} />
            <h2>QR Codes for Hospital Locations</h2>
            <span className="feature-count">{nodes.length} locations</span>
          </div>

          <p className="qr-section-desc">
            Print these QR codes and place them at the corresponding hospital
            locations. Patients can scan them to instantly get directions from
            that location.
          </p>

          <div className="qr-grid">
            {nodes.map((node) => (
              <QRCodeCard key={node} nodeName={node} />
            ))}
          </div>
        </section>
      )}

      {/* ===== ROUTE PLANNER (existing) ===== */}
      <div className="admin-navigation-grid">
        <section className="feature-card navigation-control-panel">
          <div className="feature-card-title">
            <Icon name="map" size={18} />
            <h2>Route Planner</h2>
          </div>

          <label>
            Start location
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              {nodes.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label>
            Destination
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {nodes.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <div className="route-modes">
            {[
              ["normal", "Normal"],
              ["wheelchair", "Wheelchair"],
              ["avoid_stairs", "Avoid stairs"],
            ].map(([v, t]) => (
              <label key={v}>
                <input
                  type="radio"
                  name="mode"
                  value={v}
                  checked={mode === v}
                  onChange={() => setMode(v)}
                />
                {t}
              </label>
            ))}
          </div>

          <button
            type="button"
            className="feature-primary navigation-route-btn"
            onClick={getRoute}
            disabled={loading || source === destination}
          >
            {loading ? "Finding route..." : "Get Route"}
          </button>

          {source === destination && (
            <div className="navigation-hint">
              Choose different start and destination locations.
            </div>
          )}

          {error && <div className="feature-error">{error}</div>}
        </section>

        {/* Right: Route Preview */}
        <section className="feature-card navigation-result-panel">
          <div className="feature-card-title">
            <Icon name="map" size={18} />
            <h2>Hospital Map / Route Preview</h2>
          </div>

          <div className="admin-route-map">
            <span className="route-pin entrance">●</span>
            <span className="route-map-label label-entrance">Entrance</span>
            <span className="route-pin reception">●</span>
            <span className="route-map-label label-reception">Reception</span>
            <span className="route-pin destination">●</span>
            <span className="route-map-label label-destination">Destination</span>
          </div>

          {route ? (
            <div className="route-result">
              <div>
                <span>Route</span>
                <strong>{route.path.join(" → ")}</strong>
              </div>
              <div className="route-metrics">
                <div>
                  <span>Distance</span>
                  <b>{route.distance} m</b>
                </div>
                <div>
                  <span>Estimated time</span>
                  <b>~{route.estimated_time_minutes} min</b>
                </div>
                <div>
                  <span>Mode</span>
                  <b>{mode.replace("_", " ")}</b>
                </div>
              </div>
            </div>
          ) : (
            <div className="navigation-empty">
              Choose locations and click <strong>Get Route</strong> to preview a
              path.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}