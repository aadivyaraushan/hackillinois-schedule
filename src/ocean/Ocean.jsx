import React, { useRef } from "react";
import waves from "./artwork/wave-layers.png";
import "./ocean.css";
const bands = [
  [280, 232],
  [670, 354],
  [1010, 526],
];
export default function Ocean({ dayIndex, dayCount, paused, progress = 0 }) {
  const lastProgress = useRef(progress);
  if (!paused) lastProgress.current = progress;
  // The crop and container share a ratio, so the crests never flatten.
  const position = dayCount > 1 ? 1 - (2 * dayIndex) / (dayCount - 1) : 0;
  return (
    <aside className={`ocean ${paused ? "paused" : ""}`} aria-hidden="true">
      <svg width="0" height="0">
        <defs>
          <image id="wave-art" href={waves} width="1024" height="1536" />
        </defs>
      </svg>
      {Array.from({ length: 8 }, (_, i) => {
        const [top, height] = bands[i < 2 ? 0 : i < 5 ? 1 : 2];
        return (
          <div
            className="wave-row"
            key={i}
            style={{
              "--top": `calc(-12px + ${i * 14}vh)`,
              "--wave-ratio": `1024 / ${height}`,
              "--travel": `${position * (5 + i * 1.5)}vw`,
              "--scroll-travel": `${lastProgress.current * (i % 2 ? 3 : -3)}vw`,
              "--lag": `${i * 0.075}s`,
              "--period": `${6 + i * 0.8}s`,
              "--phase": `${-i * 1.3}s`,
              "--lift": `${-10 - i * 2}px`,
            }}
          >
            <div
              className="wave-surge"
              style={{
                animationName: dayIndex % 2 ? "surge-odd" : "surge-even",
              }}
            >
              <div className="wave-surface">
                <svg
                  viewBox={`0 ${top} 1024 ${height}`}
                  preserveAspectRatio="xMidYMin meet"
                >
                  <use href="#wave-art" />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </aside>
  );
}
