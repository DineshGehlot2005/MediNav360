import { useEffect, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

const FALLBACK_NODES = ["Entrance","Reception","Main Corridor","Elevator","Pharmacy","General Medicine","Dermatology","ENT","Cardiology","Orthopedics","Neurology"];

export default function AdminNavigation() {
  const [nodes, setNodes] = useState(FALLBACK_NODES);
  const [source, setSource] = useState("Entrance");
  const [destination, setDestination] = useState("Cardiology");
  const [mode, setMode] = useState("normal");
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.adminNavigationNodes().then(r => setNodes(r.nodes?.length ? r.nodes : FALLBACK_NODES)).catch(() => {});
  }, []);

  async function getRoute() {
    setLoading(true); setError(""); setRoute(null);
    try { setRoute(await api.shortestPath(source, destination, mode)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return <div className="admin-list-page">
    <div className="admin-list-header"><div><div className="admin-breadcrumb">Admin / Hospital Navigation</div><h1><Icon name="map" size={23}/>Hospital Navigation</h1><p>Preview accessible routes between hospital locations for staff and patients.</p></div></div>
    <div className="admin-navigation-grid">
      <section className="admin-form-panel navigation-control-panel">
        <h2>Route Planner</h2>
        <label>Start location<select value={source} onChange={e=>setSource(e.target.value)}>{nodes.map(n=><option key={n}>{n}</option>)}</select></label>
        <label>Destination<select value={destination} onChange={e=>setDestination(e.target.value)}>{nodes.map(n=><option key={n}>{n}</option>)}</select></label>
        <div className="route-modes"><label><input type="radio" checked={mode === "normal"} onChange={()=>setMode("normal")}/> Normal</label><label><input type="radio" checked={mode === "wheelchair"} onChange={()=>setMode("wheelchair")}/> Wheelchair</label><label><input type="radio" checked={mode === "avoid_stairs"} onChange={()=>setMode("avoid_stairs")}/> Avoid stairs</label></div>
        <button className="btn btn-blue navigation-route-btn" onClick={getRoute} disabled={loading || source === destination}><Icon name="map" size={16}/>{loading ? "Finding route..." : "Get Route"}</button>
        {source === destination && <div className="navigation-hint">Choose different start and destination locations.</div>}
        {error && <div className="admin-error">{error}</div>}
      </section>

      <section className="admin-data-panel navigation-result-panel">
        <div className="admin-panel-header"><div className="admin-panel-title"><Icon name="map" size={18}/><h2>Hospital Map / Route Preview</h2></div></div>
        <div className="admin-route-map"><div className="route-road rr1"/><div className="route-road rr2"/><span className="route-pin entrance">●</span><span className="route-pin reception">●</span><span className="route-pin destination">●</span><span className="route-map-label label-entrance">Entrance</span><span className="route-map-label label-reception">Reception</span><span className="route-map-label label-destination">Destination</span></div>
        {route ? <div className="route-result"><div><span>Route</span><strong>{route.path.join(" → ")}</strong></div><div className="route-metrics"><div><span>Distance</span><b>{route.distance} m</b></div><div><span>Estimated time</span><b>~{route.estimated_time_minutes} min</b></div><div><span>Mode</span><b>{mode.replace("_", " ")}</b></div></div></div> : <div className="empty-state navigation-empty">Choose locations and click <strong>Get Route</strong> to preview a path.</div>}
      </section>
    </div>
  </div>;
}
