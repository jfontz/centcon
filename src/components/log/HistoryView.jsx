import { useState, useEffect } from "react";
import {
  readHistory,
  bucketEvents,
  clearHistory,
} from "../../utils/historyStorage";
import ClearHistoryModal from "../modals/ClearHistoryModal";

const RANGES = [
  { label: "24H", ms: 24 * 60 * 60 * 1000, buckets: [24, 48] },
  { label: "7D", ms: 7 * 24 * 60 * 60 * 1000, buckets: [7, 14] },
  { label: "60D", ms: 60 * 24 * 60 * 60 * 1000, buckets: [60] },
];

const SEVERITY_COLORS = {
  0: { bar: "#1f1f1f", label: "Clean" },
  1: { bar: "#2563eb", label: "Reboot" },
  2: { bar: "#d97706", label: "Warning" },
  3: { bar: "#dc2626", label: "Outage" },
  4: { bar: "#dc2626", label: "Fiber Lost" },
};

const fmt = (ts, rangeLabel) => {
  const d = new Date(ts);
  if (rangeLabel === "24H") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const HistoryView = ({ refreshTick }) => {
  const [rangeIdx, setRangeIdx] = useState(0);
  const [bucketIdx, setBucketIdx] = useState(0);
  const [events, setEvents] = useState([]);
  const [hoveredBucket, setHoveredBucket] = useState(null);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    setEvents(readHistory());
  }, [refreshTick]);

  const handleClearConfirm = () => {
    clearHistory();
    setEvents([]);
    setSelectedBucket(null);
    setShowClearModal(false);
  };

  const range = RANGES[rangeIdx];
  const safeBucketIdx = bucketIdx < range.buckets.length ? bucketIdx : 0;
  const bucketCount = range.buckets[safeBucketIdx];
  const buckets = bucketEvents(events, range.ms, bucketCount);

  const activeBucket = selectedBucket ?? hoveredBucket;

  const totalOutages = events.filter(
    (e) =>
      e.type === "los" || e.type === "internet" || e.type === "unreachable",
  ).length;

  const cleanPct = buckets.length
    ? Math.round(
        (buckets.filter((b) => b.worstSeverity === 0).length / buckets.length) *
          100,
      )
    : 100;

  return (
    <div className="flex flex-col gap-4 p-4 font-mono text-xs">
      {/* Summary row */}
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-600">
        <span>
          {cleanPct}% clean · {totalOutages} event
          {totalOutages !== 1 ? "s" : ""} recorded
        </span>
        <button
          onClick={() => setShowClearModal(true)}
          className="text-zinc-700 hover:text-zinc-400 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Range + resolution toggles */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => {
                setRangeIdx(i);
                setBucketIdx(0);
                setSelectedBucket(null);
              }}
              className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-widest transition-colors ${
                rangeIdx === i
                  ? "bg-zinc-700 text-zinc-200"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {range.buckets.length > 1 && (
          <div className="flex gap-1">
            {range.buckets.map((b, i) => (
              <button
                key={b}
                onClick={() => {
                  setBucketIdx(i);
                  setSelectedBucket(null);
                }}
                className={`px-2 py-0.5 rounded text-[10px] tracking-widest transition-colors ${
                  safeBucketIdx === i
                    ? "bg-zinc-700 text-zinc-200"
                    : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div
        className="flex items-end gap-px w-full"
        style={{ height: "40px" }}
        onMouseLeave={() => setHoveredBucket(null)}
      >
        {buckets.map((bucket, i) => {
          const color = SEVERITY_COLORS[bucket.worstSeverity]?.bar ?? "#1f1f1f";
          const isActive = activeBucket === i;
          return (
            <div
              key={i}
              className="flex-1 rounded-sm cursor-pointer transition-opacity"
              style={{
                height: bucket.worstSeverity === 0 ? "60%" : "100%",
                backgroundColor: color,
                opacity: activeBucket !== null && !isActive ? 0.4 : 1,
                minWidth: "2px",
              }}
              onMouseEnter={() => setHoveredBucket(i)}
              onClick={() => setSelectedBucket(selectedBucket === i ? null : i)}
            />
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-[9px] text-zinc-700 -mt-2">
        <span>{fmt(Date.now() - range.ms, range.label)}</span>
        <span>Now</span>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(SEVERITY_COLORS)
          .filter(([k]) => k !== "4")
          .map(([severity, { bar, label }]) => (
            <div key={severity} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: bar }}
              />
              <span className="text-[9px] text-zinc-600 uppercase tracking-wider">
                {label}
              </span>
            </div>
          ))}
      </div>

      {/* Selected/hovered bucket detail */}
      {activeBucket !== null && (
        <div className="border border-zinc-800 rounded-md p-3 flex flex-col gap-2 bg-zinc-950">
          <span className="text-[9px] uppercase tracking-widest text-zinc-600">
            {fmt(buckets[activeBucket].start, range.label)} —{" "}
            {fmt(buckets[activeBucket].end, range.label)}
          </span>
          {buckets[activeBucket].events.length === 0 ? (
            <span className="text-zinc-700 text-[10px]">
              No events — all clear
            </span>
          ) : (
            buckets[activeBucket].events.map((e) => (
              <div key={e.id} className="flex gap-2 items-start">
                <span className="text-zinc-600 shrink-0">
                  {new Date(e.ts).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-zinc-300">{e.text}</span>
              </div>
            ))
          )}
        </div>
      )}

      <ClearHistoryModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearConfirm}
      />
    </div>
  );
};

export default HistoryView;
