import React from "react";

// Node positions ko map karne ke liye (seed.py ke x, y coordinates ke hisaab se)
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

const FLOOR_COLORS = {
  Ground: "#f0f9ff",
  First: "#fef3c7",
  Second: "#fce7f3",
};

export default function HospitalMap({
  route,
  source,
  destination,
  activeFloor = "Ground",
  onNodeClick,
}) {
  const path = route?.path || [];
  const pathSet = new Set(path);

  // Route ke consecutive nodes ke beech line draw karo
  const routeLines = [];
  for (let i = 0; i < path.length - 1; i++) {
    const from = NODE_POSITIONS[path[i]];
    const to = NODE_POSITIONS[path[i + 1]];
    if (from && to) {
      routeLines.push({ from, to, key: `${path[i]}-${path[i + 1]}` });
    }
  }

  return (
    <div className="hospital-map-container">
      <svg
        viewBox="0 0 720 400"
        className="hospital-map-svg"
        style={{ width: "100%", height: "auto", maxHeight: "400px" }}
      >
        {/* ===== LAYER 1: Background floor ===== */}
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

        {/* ===== LAYER 2: Corridors (dashed lines) ===== */}
        {Object.entries(NODE_POSITIONS).map(([name, pos]) => {
          if (name === "Entrance") return null;
          const entrancePos = NODE_POSITIONS["Entrance"];
          return (
            <line
              key={`corridor-${name}`}
              x1={entrancePos.x}
              y1={entrancePos.y}
              x2={pos.x}
              y2={pos.y}
              stroke="#e2e8f0"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* ===== LAYER 3: Pulsing marker (SABSE PEHLE — taaki text upar dikhe) ===== */}
        {source && NODE_POSITIONS[source] && (
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

        {/* ===== LAYER 4: Route highlight ===== */}
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

        {/* ===== LAYER 5: Nodes (rects + text) — sabse upar ===== */}
        {Object.entries(NODE_POSITIONS).map(([name, pos]) => {
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
                fontWeight={isInPath || isSource || isDestination ? "700" : "500"}
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