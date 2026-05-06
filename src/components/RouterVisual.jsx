/**
 * RouterVisual Component
 */

import { useRouter } from "../context/RouterContext";
import { getLedStates } from "../utils/getLedStates";

const LED_COLORS = {
  green: {
    bg: "bg-green-500",
    shadow: "shadow-[0_0_6px_2px_rgba(34,197,94,0.5)]",
  },
  amber: {
    bg: "bg-amber-400",
    shadow: "shadow-[0_0_6px_2px_rgba(251,191,36,0.5)]",
  },
  red: { bg: "bg-red-500", shadow: "shadow-[0_0_6px_2px_rgba(239,68,68,0.5)]" },
  off: { bg: "bg-[#2a2a2a]", shadow: "" },
};

const ANIMATE_CLASSES = {
  pulse: "animate-pulse",
  blink: "animate-[blink_0.8s_step-end_infinite]",
  null: "",
};

const Led = ({ color, animate }) => {
  const { bg, shadow } = LED_COLORS[color] || LED_COLORS.off;
  const animClass = ANIMATE_CLASSES[animate] || "";
  return (
    <div
      className={`rounded-full shrink-0 ${bg} ${shadow} ${animClass}`}
      style={{ width: "2.2cqw", height: "2.2cqw" }}
    />
  );
};

const RouterBody = ({ leds, dimmed, model, software }) => (
  <div
    style={{
      containerType: "inline-size",
      containerName: "router",
      maxWidth: "280px",
    }}
    className={`w-full mx-auto transition-opacity duration-500 ${
      dimmed ? "opacity-30" : "opacity-100"
    }`}
  >
    <div className="flex flex-col items-stretch w-full">
      {/* ── ANTENNA ROW — z-index 0, sits behind body ── */}
      <div
        className="flex justify-between w-full"
        style={{ position: "relative", zIndex: 0 }}
      >
        <div
          className="bg-[#1c1c1c] border border-[#383838] rounded-t-full"
          style={{
            width: "5cqw",
            height: "40cqw",
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
        />
        <div
          className="bg-[#1c1c1c] border border-[#383838] rounded-t-full"
          style={{
            width: "5cqw",
            height: "40cqw",
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
        />
      </div>

      {/* ── MAIN BODY — overlaps antenna by 15cqw (half their 30cqw height) ── */}
      <div
        className="w-full bg-[#111] border border-[#2e2e2e] rounded-2xl flex flex-col"
        style={{
          minHeight: "55cqw",
          position: "relative",
          zIndex: 1,
          marginTop: "-15cqw",
        }}
      >
        {/* LED strip */}
        <div
          className="flex w-full items-center justify-around shrink-0"
          style={{ padding: "6cqw 4cqw 3cqw" }}
        >
          {leds.map((led) => (
            <div
              key={led.id}
              className="flex flex-col items-center min-w-0 flex-1"
              style={{ gap: "2.5cqw" }}
            >
              <Led color={led.color} animate={led.animate} />
              <span
                className="uppercase leading-none whitespace-nowrap text-center"
                style={{
                  fontSize: "3cqw",
                  letterSpacing: "0.04em",
                  color: "#666",
                }}
              >
                {led.label}
              </span>
            </div>
          ))}
        </div>

        {/* Model / software */}
        <div
          className="flex flex-col items-center justify-center flex-1"
          style={{ padding: "2cqw 4cqw 6cqw", gap: "1.5cqw" }}
        >
          {model && (
            <p
              className="font-mono font-semibold tracking-widest uppercase text-center leading-tight"
              style={{ fontSize: "4.5cqw", color: "#888" }}
            >
              {model}
            </p>
          )}
          {software && (
            <p
              className="font-mono tracking-wider text-center leading-tight truncate w-full"
              style={{ fontSize: "3.2cqw", color: "#555" }}
            >
              {software}
            </p>
          )}
        </div>
      </div>

      {/* ── BASE / FOOT ── */}
      <div
        className="flex justify-center w-full mt-1"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div
          className="bg-[#1a1a1a] border border-[#2e2e2e]"
          style={{
            width: "68cqw",
            height: "5cqw",
            borderRadius: "0 0 6px 6px",
          }}
        />
      </div>
    </div>
  </div>
);

const RouterVisual = () => {
  const { data, status, commandState } = useRouter();
  const leds = getLedStates(data, status, commandState);

  const dimmed = false;
  const model = data?.device?.model;
  const software = data?.device?.software;

  return (
    <div className="flex flex-col items-center w-full">
      <RouterBody
        leds={leds}
        dimmed={dimmed}
        model={model}
        software={software}
      />
    </div>
  );
};

export default RouterVisual;
