import React from "react";

// Node positions (seed.py ke hisaab se)
const NODE_POSITIONS = {
  Entrance: { x: 80, y: 320 },
  Reception: { x: 200, y: 280 },
  "Main Corridor": { x: 320, y: 240 },
  Elevator: { x: 420, y: 200 },
  Pharmacy: { x: 500, y: 320 },
  Cardiology: { x: 520, y: 120 },
  Neurology: { x: 380, y: 80 },
  Orthopedics: { x: 200, y: 120 },
  Dermatology: { x: 100, y: 80 },
  ENT: { x: 620, y: 200 },
  "General Medicine": { x: 260, y: 200 },
};

// Har node ka floor (Navigation.jsx se sync)
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

const FLOOR_COLORS = {
  Ground: "#f0f9ff",
  First: "#fef3c7",
  Second: "#fce7f3",
};

const FLOOR_LABELS = {
  Ground: "Ground Floor",
  First: "First Floor",
  Second: "Second Floor",
};

const ALL_FLOORS = ["Ground", "First", "Second"];

export default function HospitalMap({
  route,
  source,
  destination,
  activeFloor = "Ground",
  onNodeClick,
  onFloorChange,
}) {
  const path = route?.path || [];
  const pathSet = new Set(path);

  // Sirf active floor ke nodes dikhao
  const visibleNodes = Object.entries(NODE_POSITIONS).filter(
    ([name]) => NODE_FLOORS[name] === activeFloor
  );

  // Route lines — sirf woh lines jo active floor pe hain
  const routeLines = [];
  for (let i = 0; i < path.length - 1; i++) {
    const fromName = path[i];
    const toName = path[i + 1];
    const fromPos = NODE_POSITIONS[fromName];
    const toPos = NODE_POSITIONS[toName];
    const fromFloor = NODE_FLOORS[fromName];
    const toFloor = NODE_FLOORS[toName];

    // Dono nodes same floor pe hone chahiye (active floor pe)
    if (
      fromPos &&
      toPos &&
      fromFloor === activeFloor &&
      toFloor === activeFloor
    ) {
      routeLines.push({
        from: fromPos,
        to: toPos,
        key: `${fromName}-${toName}`,
      });
    }
  }

  // Corridors — sirf same floor ke nodes ke beech
  const corridorLines = visibleNodes
    .filter(([name]) => name !== "Entrance")
    .map(([name, pos]) => {
      const entrancePos = NODE_POSITIONS["Entrance"];
      // Sirf tab dikhao jab Entrance bhi same floor pe ho
      if (NODE_FLOORS["Entrance"] !== activeFloor) return null;
      return { key: `corridor-${name}`, from: entrancePos, to: pos };
    })
    .filter(Boolean);

  return (
    <div className="hospital-map-container">
      {/* ===== FLOOR TABS ===== */}
      <div className="floor-tabs">
        {ALL_FLOORS.map((floor) => {
          const isActive = floor === activeFloor;
          const hasRouteNode = path.some((n) => NODE_FLOORS[n] === floor);
          return (
            <button
              key={floor}
              type="button"
              className={`floor-tab ${isActive ? "active" : ""} ${
                hasRouteNode ? "has-route" : ""
              }`}
              onClick={() => onFloorChange && onFloorChange(floor)}
            >
              {FLOOR_LABELS[floor]}
              {hasRouteNode && <span className="floor-route-dot" />}
            </button>
          );
        })}
      </div>

      <svg
        viewBox="0 0 720 400"
        className="hospital-map-svg"
        style={{ width: "100%", height: "auto", maxHeight: "400px" }}
      >
        {/* Background floor */}
        <rect
          x="20"
          y="20"
          width="680"
          height="360"
          rx="12"
          fill={FLOOR_COLORS[activeFloor] || "#f8fafc"}
          stroke="#e2e8f0"
          strokeWidth="2"
        />

        {/* Floor label watermark */}
        <text
          x="360"
          y="55"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="#cbd5e1"
          opacity="0.8"
          style={{ pointerEvents: "none" }}
        >
          {FLOOR_LABELS[activeFloor]}
        </text>

        {/* Corridors */}
        {corridorLines.map(({ key, from, to }) => (
          <line
            key={key}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#e2e8f0"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        ))}

        {/* Pulsing source marker (sabse pehle) */}
        {source && NODE_POSITIONS[source] && NODE_FLOORS[source] === activeFloor && (
          <g style={{ pointerEvents: "none" }}>
            <circle
              cx={NODE_POSITIONS[source].x}
              cy={NODE_POSITIONS[source].y}
              r="35"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              opacity="0.4"
            >
              <animate
                attributeName="r"
                values="28;45;28"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0;0.6"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )}

        {/* Route highlight */}
        {routeLines.map(({ from, to, key }) => (
          <line
            key={key}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#3b82f6"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.8"
          />
        ))}

        {/* Nodes */}
        {visibleNodes.map(([name, pos]) => {
          const isSource = name === source;
          const isDestination = name === destination;
          const isInPath = pathSet.has(name);
          const words = name.split(" ");
          const isTwoLine = words.length > 1;

          return (
            <g
              key={name}
              onClick={() => onNodeClick && onNodeClick(name)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={pos.x - 45}
                y={pos.y - 20}
                width="90"
                height={isTwoLine ? 38 : 34}
                rx="8"
                fill={
                  isDestination
                    ? "#10b981"
                    : isSource
                    ? "#ef4444"
                    : isInPath
                    ? "#dbeafe"
                    : "#ffffff"
                }
                stroke={isInPath ? "#3b82f6" : "#cbd5e1"}
                strokeWidth={isInPath ? "2" : "1.5"}
              />
              <text
                x={pos.x}
                y={isTwoLine ? pos.y - 3 : pos.y + 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight={
                  isInPath || isSource || isDestination ? "700" : "500"
                }
                fill={
                  isDestination || isSource
                    ? "#ffffff"
                    : isInPath
                    ? "#1e40af"
                    : "#475569"
                }
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {words.map((word, i) => (
                  <tspan key={i} x={pos.x} dy={i === 0 ? 0 : 11}>
                    {word}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

        {/* Empty floor message */}
        {visibleNodes.length === 0 && (
          <text
            x="360"
            y="200"
            textAnchor="middle"
            fontSize="14"
            fill="#94a3b8"
            style={{ pointerEvents: "none" }}
          >
            No locations on this floor
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="map-legend">
        <span>
          <span className="legend-dot" style={{ background: "#ef4444" }}></span>{" "}
          You are here
        </span>
        <span>
          <span className="legend-dot" style={{ background: "#10b981" }}></span>{" "}
          Destination
        </span>
        <span>
          <span className="legend-dot" style={{ background: "#3b82f6" }}></span>{" "}
          Route
        </span>
      </div>
    </div>
  );
}