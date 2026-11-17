import React, { useRef, useState } from "react";
import {
  Plus,
  Minus,
  Maximize,
  Move,
  ArrowUpRight,
  Crosshair,
  Sparkles,
} from "lucide-react";

const shapes = {
  guitar: {
    points: [
      [172, 27],
      [194, 34],
      [180, 66],
      [166, 94],
      [174, 120],
      [171, 151],
      [149, 184],
      [113, 190],
      [86, 174],
      [79, 147],
      [93, 125],
      [123, 122],
      [145, 100],
      [158, 66],
      [172, 27],
      [108, 145],
      [136, 155],
      [149, 139],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [10, 11],
      [11, 12],
      [12, 13],
      [13, 0],
      [15, 16],
      [16, 17],
      [17, 15],
      [13, 16],
      [2, 16],
    ],
  },
  note: {
    points: [
      [135, 160],
      [135, 68],
      [216, 49],
      [216, 139],
      [205, 155],
      [183, 158],
      [176, 146],
      [184, 134],
      [201, 130],
      [216, 133],
      [135, 151],
      [118, 148],
      [96, 156],
      [92, 170],
      [108, 179],
      [129, 173],
      [135, 160],
      [135, 88],
      [216, 69],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 3],
      [10, 11],
      [11, 12],
      [12, 13],
      [13, 14],
      [14, 15],
      [15, 0],
      [17, 18],
    ],
  },
  web: {
    points: [
      [105, 59],
      [67, 117],
      [105, 175],
      [140, 192],
      [178, 42],
      [214, 59],
      [252, 117],
      [214, 175],
      [156, 117],
      [89, 117],
      [229, 117],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [3, 4],
      [5, 6],
      [6, 7],
      [1, 9],
      [6, 10],
      [3, 8],
      [8, 4],
    ],
  },
  pencil: {
    points: [
      [93, 171],
      [101, 134],
      [176, 59],
      [194, 41],
      [216, 63],
      [197, 81],
      [123, 157],
      [93, 171],
      [101, 134],
      [123, 157],
      [112, 145],
      [187, 70],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 0],
      [1, 6],
      [2, 5],
      [10, 11],
      [0, 7],
      [7, 8],
      [8, 9],
    ],
  },
  mountain: {
    points: [
      [57, 177],
      [95, 124],
      [120, 144],
      [168, 59],
      [205, 112],
      [226, 95],
      [270, 177],
      [57, 177],
      [140, 108],
      [160, 122],
      [177, 106],
      [193, 122],
      [128, 177],
      [225, 177],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 0],
      [8, 9],
      [9, 10],
      [10, 11],
      [2, 12],
      [4, 13],
    ],
  },
  language: {
    points: [
      [76, 58],
      [129, 45],
      [205, 49],
      [242, 78],
      [248, 125],
      [220, 156],
      [160, 163],
      [116, 190],
      [120, 160],
      [79, 149],
      [62, 115],
      [76, 58],
      [111, 101],
      [156, 101],
      [201, 101],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [10, 0],
      [12, 13],
      [13, 14],
    ],
  },
  book: {
    points: [
      [159, 75],
      [124, 53],
      [75, 52],
      [73, 166],
      [120, 166],
      [159, 184],
      [201, 166],
      [249, 167],
      [249, 53],
      [204, 54],
      [159, 75],
      [159, 184],
      [96, 87],
      [126, 91],
      [96, 113],
      [126, 117],
      [191, 91],
      [223, 87],
      [192, 117],
      [223, 113],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 0],
      [0, 5],
      [12, 13],
      [14, 15],
      [16, 17],
      [18, 19],
    ],
  },
  compass: {
    points: [
      [160, 28],
      [198, 78],
      [250, 118],
      [198, 157],
      [160, 206],
      [120, 157],
      [70, 118],
      [120, 78],
      [160, 28],
      [181, 97],
      [160, 145],
      [140, 118],
      [160, 91],
      [160, 145],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 0],
      [0, 4],
      [2, 6],
      [9, 10],
      [10, 11],
      [11, 12],
      [12, 9],
    ],
  },
};
export function shapeFor(name = "") {
  if (/guitar|ukulele|bass/i.test(name)) return "guitar";
  if (/music|piano|sing|drum|violin|audio/i.test(name)) return "note";
  if (/code|coding|web|program|python|javascript|software|html/i.test(name))
    return "web";
  if (/draw|sketch|paint|art|design|writ/i.test(name)) return "pencil";
  if (/hiking|outdoor|climb|run|fitness|mountain/i.test(name))
    return "mountain";
  if (/spanish|french|german|language|japanese|italian|korean/i.test(name))
    return "language";
  if (
    /biology|chemistry|physics|psychology|history|math|science|study/i.test(
      name,
    )
  )
    return "book";
  return "compass";
}
export function colorFor(skill) {
  return skill.color === "peach"
    ? "#78cffe"
    : skill.color === "lavender"
      ? "#b99bff"
      : "#7ce0c1";
}
export function ConstellationGlyph({
  skill,
  interactive = false,
  onStart,
  celebrate = false,
  loading = false,
}) {
  const shape = shapes[shapeFor(skill.name)];
  const lit = Math.min(shape.points.length, Math.max(1, skill.sessions + 1));
  const index = Math.min(lit, shape.points.length - 1);
  const brightness = 0.45 + Math.min(skill.confidence / 15, 0.5);
  return (
    <div
      className={
        "constellation-glyph " +
        (interactive ? "interactive" : "") +
        (celebrate ? " celebrating" : "")
      }
      style={{ "--star-color": colorFor(skill), "--brightness": brightness }}
    >
      <svg viewBox="0 0 320 235" fill="none" aria-hidden="true">
        <ellipse
          cx="160"
          cy="118"
          rx="99"
          ry="84"
          fill="var(--star-color)"
          opacity=".025"
        />
        {shape.edges.map(([a, b], i) => (
          <line
            key={i}
            x1={shape.points[a][0]}
            y1={shape.points[a][1]}
            x2={shape.points[b][0]}
            y2={shape.points[b][1]}
            className={a < lit && b < lit ? "connection lit" : "connection"}
          />
        ))}
        {Array.from({ length: Math.min(skill.sessions, 18) }, (_, i) => {
          const anchor = shape.points[(i * 3 + 2) % shape.points.length];
          const angle = i * 2.39;
          const end = [
            anchor[0] + Math.cos(angle) * (13 + (i % 4) * 7),
            anchor[1] + Math.sin(angle) * (17 + (i % 3) * 8),
          ];
          return (
            <g key={"branch" + i} className="star-branch">
              <line x1={anchor[0]} y1={anchor[1]} x2={end[0]} y2={end[1]} />
              <circle cx={end[0]} cy={end[1]} r={1.2 + (i % 2) * 0.4} />
            </g>
          );
        })}
        {shape.points.map(([x, y], i) => (
          <g
            key={i}
            className={
              "star-point " +
              (i < lit ? "lit" : "") +
              (i === index ? " next" : "")
            }
          >
            <circle
              cx={x}
              cy={y}
              r={i === 0 ? 14 : i === index ? 11 : 7}
              className="star-halo"
            />
            <circle
              cx={x}
              cy={y}
              r={i === 0 ? 4 : i < lit ? 2.8 : i === index ? 3 : 1.5}
            />
            {i === index && (
              <circle cx={x} cy={y} r="7" className="next-orbit" />
            )}
          </g>
        ))}
        <path d="M154 118h12m-6-6v12" className="center-cross" />
      </svg>
      {interactive && (
        <button
          className="active-star"
          disabled={loading}
          aria-busy={loading}
          aria-label={`Practice the next star in ${skill.name}`}
          onClick={onStart}
          style={{
            left: (shape.points[index][0] / 320) * 100 + "%",
            top: (shape.points[index][1] / 235) * 100 + "%",
          }}
        >
          <span />
          <span className="star-tooltip">
            Your next little step <ArrowUpRight size={12} />
          </span>
        </button>
      )}
    </div>
  );
}
const positions = [
  [24, 42],
  [73, 31],
  [53, 76],
  [15, 83],
  [86, 77],
  [49, 20],
];
export function Universe({ skills, onSelect, onAdd, demo }) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const drag = useRef(null);
  const [moving, setMoving] = useState(false);
  function reset() {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }
  function pos(i) {
    if (i < 6) return positions[i];
    const n = i - 6;
    return [18 + (n % 4) * 24, 110 + Math.floor(n / 4) * 42];
  }
  const setViewZoom = (n) =>
    setZoom((z) => Math.min(1.8, Math.max(0.55, z + n)));
  return (
    <section
      className={"universe " + (moving ? "is-dragging" : "")}
      aria-label="Your interactive skill universe"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        const keys = {
          ArrowLeft: [80, 0],
          ArrowRight: [-80, 0],
          ArrowUp: [0, 80],
          ArrowDown: [0, -80],
        };
        if (keys[e.key]) {
          e.preventDefault();
          setPan((p) => ({ x: p.x + keys[e.key][0], y: p.y + keys[e.key][1] }));
        }
        if (e.key === "Home") reset();
      }}
      onPointerDown={(e) => {
        if (e.button !== 0 || e.target.closest("button")) return;
        drag.current = { x: e.clientX, y: e.clientY, pan };
        setMoving(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (drag.current)
          setPan({
            x: drag.current.pan.x + e.clientX - drag.current.x,
            y: drag.current.pan.y + e.clientY - drag.current.y,
          });
      }}
      onPointerUp={() => {
        drag.current = null;
        setMoving(false);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setMoving(false);
      }}
    >
      <div className="universe-coordinates" aria-hidden="true">
        <span>YOUR PERSONAL SKY</span>
        <span>∞ POSSIBILITIES</span>
      </div>
      <div className="orbital-ring ring-one" />
      <div className="orbital-ring ring-two" />
      <div
        className="space-world"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {skills.map((skill, i) => (
          <button
            key={skill.id}
            className="skill-cluster"
            style={{
              left: pos(i)[0] + "%",
              top: pos(i)[1] + "%",
              "--star-color": colorFor(skill),
            }}
            onClick={() => onSelect(skill)}
            aria-label={`Explore ${skill.name} constellation`}
          >
            <span className="cluster-aura" />
            <ConstellationGlyph skill={skill} />
            <span className="cluster-meta">
              <span className="cluster-index">
                {String(i + 1).padStart(2, "0")} /{" "}
                {skill.track === "academic"
                  ? "KNOW & UNDERSTAND"
                  : "MAKE & EXPLORE"}
              </span>
              <strong>
                {skill.name}
                <ArrowUpRight size={14} />
              </strong>
              <small>
                {skill.sessions === 0
                  ? "Your first star is waiting"
                  : `${skill.sessions} little steps · ${Math.min(skill.sessions + 1, 20)} stars illuminated`}
              </small>
            </span>
          </button>
        ))}
        <button
          className="new-cluster"
          style={{
            left: skills.length < 4 ? "86%" : "115%",
            top: skills.length < 4 ? "80%" : "35%",
          }}
          onClick={onAdd}
          aria-label="Discover a new skill"
        >
          <span>
            <Plus size={21} />
          </span>
          <strong>A new curiosity</strong>
          <small>What will you explore?</small>
        </button>
      </div>
      <div className="map-footer">
        <span>
          <Move size={13} />
          Drag to wander. Choose a constellation to get closer.
        </span>
        <div
          className="map-controls"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setViewZoom(-0.15)}
            aria-label="Zoom out"
            disabled={zoom <= 0.55}
          >
            <Minus size={15} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setViewZoom(0.15)}
            aria-label="Zoom in"
            disabled={zoom >= 1.8}
          >
            <Plus size={15} />
          </button>
          <i />
          <button onClick={reset} aria-label="Reset universe view">
            <Maximize size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
