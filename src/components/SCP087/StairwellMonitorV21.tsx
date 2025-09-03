import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "../../store/gameStore";
import type { Encounter, Personnel, EncounterKind } from "../../store/scp087.types";
import { Button } from "../ui/button";

/**
 * SCP-087 MONITOR v2.1
 * - Fixed-width layout with box-drawing chars
 * - Accurate 34-step depth ticks (000, 034, 068, ...)
 * - Light/battery bar + HUD
 * - Maps absoluteDepth of personnel/encounters to a viewport around current depth
 */

type Props = { width?: number }; // controls inner column width (ASCII area)

const STEP = 34;          // 087 log cadence
const TICKS_VISIBLE = 9;  // number of labeled ticks in viewport

const pad3 = (n: number) => String(n).padStart(3, "0");

export default function StairwellMonitorV21({ width = 24 }: Props) {
  console.log("StairwellMonitorV21 loading - PersonnelUpgradeModal removed");
  
  const scp087 = useGameStore(state => state.scp087);
  const toggleFlashlight = useGameStore(state => state.toggleFlashlight);
  const drainFlashlight = useGameStore(state => state.drainFlashlight);
  const rechargeFlashlightV2 = useGameStore(state => state.rechargeFlashlightV2);
  const movePersonnel = useGameStore(state => state.movePersonnel);
  const spawnEncounterAtDepth = useGameStore(state => state.spawnEncounterAtDepth);
  const resolveEncounter = useGameStore(state => state.resolveEncounter);
  const cullExpiredEncounters = useGameStore(state => state.cullExpiredEncounters);
  
  const [recentEncounter, setRecentEncounter] = useState<Encounter | null>(null);
  
  // Handle legacy store format - create working defaults
  const flashlight = scp087?.flashlight || {
    on: (scp087?.flashlightBattery || 100) > 0,
    charge: scp087?.flashlightBattery || 100,
    capacity: 100,
    drainPerSec: 6,
    rechargePerSec: 22,
    lowThreshold: 20,
  };
  
  const personnel = scp087?.personnel?.length ? scp087.personnel : [
    { 
      id: "p1", 
      name: "Operative Δ-7", 
      role: "Scout" as const, 
      absoluteDepth: 0, 
      lane: "L" as const,
      level: 1,
      experience: 0,
      speed: 1.2,
      survivalRate: 0.9,
      active: false,
      status: "active" as const
    },
    { 
      id: "p2", 
      name: "Tech A. Morse", 
      role: "Research" as const, 
      absoluteDepth: 68, 
      lane: "R" as const,
      level: 1,
      experience: 0,
      speed: 0.8,
      survivalRate: 0.7,
      active: false,
      status: "active" as const
    },
    { 
      id: "p3", 
      name: "Handler R-3", 
      role: "Handler" as const, 
      absoluteDepth: 136, 
      lane: "L" as const,
      level: 1,
      experience: 0,
      speed: 1.0,
      survivalRate: 0.95,
      active: false,
      status: "active" as const
    },
  ];
  
  // Convert old encounters format to new format if needed
  const activeEncounters: Encounter[] = scp087?.activeEncounters?.map((e: any) => {
    // Handle both old and new formats
    if ('kind' in e) {
      // Already new format
      return e as Encounter;
    } else {
      // Old format - convert
      return {
        id: e.id,
        x: 0, y: 0,
        kind: e.type === "hostile" ? "087-1" as const : "anomaly" as const,
        absoluteDepth: (e.position || 0) * 34,
        rewardPE: e.type === "hostile" ? 150 : 40,
        expiresAt: Date.now() + 10000
      } as Encounter;
    }
  }) || [];
  
  if (!scp087) {
    return <div className="p-4 text-emerald-400 font-mono">Initializing SCP-087 Terminal...</div>;
  }
  
  const depth = scp087.currentDepth || scp087.depth || 0;
  const f = flashlight;

  const [t, setT] = useState(0);
  const raf = useRef<number | null>(null);

  // animation/update loop (no drift; ties to store values)
  useEffect(() => {
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      setT(p => p + dt);

      if (f.on) drainFlashlight(dt); 
      else rechargeFlashlightV2(dt * 0.7);
      movePersonnel(dt);
      cullExpiredEncounters();

      // occasional encounter near current depth
      if (Math.random() < 0.025 && f.on) {
        const jitter = (Math.random() * 3 - 1.5) * STEP;
        const targetDepth = Math.max(0, Math.round(depth / STEP) * STEP + jitter);
        const kind: EncounterKind = Math.random() < 0.2 ? "087-1" : "anomaly";
        spawnEncounterAtDepth(targetDepth, kind);
      }

      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [f.on, drainFlashlight, rechargeFlashlightV2, movePersonnel, cullExpiredEncounters, spawnEncounterAtDepth, depth]);

  // viewport window centered on current depth
  const anchor = Math.floor(depth / STEP) * STEP;
  const start = anchor - Math.floor(TICKS_VISIBLE / 2) * STEP;

  // battery bar (10 cells)
  const battCells = 10;
  const battFill = Math.round((f.charge / f.capacity) * battCells);
  const battBar = "█".repeat(Math.max(0, Math.min(battCells, battFill))) +
                  "░".repeat(Math.max(0, battCells - battFill));

  // Render each tick block to a line group
  type Row = { text: string };
  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];

    // header
    out.push({text: "► SCP-087 MONITOR ◄"});
    out.push({text: "║ SYSTEM READY ║"});
    out.push({text: "╔═══════════════════╗"});
    out.push({text: "║ SCP-087 TERM v2.1 ║"});
    out.push({text: "║ [CLASSIFIED]      ║"});
    out.push({text: "╚═╤═══════════════╤═╝"});
    out.push({text: `  │ LIGHT: [${battBar}] │`});

    // helper to see if absoluteDepth is within a tick band
    const within = (abs: number, tick: number) => {
      const top = tick - STEP / 2;
      const bot = tick + STEP / 2;
      return abs >= top && abs < bot;
    };

    // build tick blocks top -> bottom
    for (let i = 0; i < TICKS_VISIBLE; i++) {
      const d = start + i * STEP;
      const label = pad3(Math.max(0, d));
      // Check if current depth falls within this tick range
      const isCurrentDepth = within(depth, d);
      // columns: we keep a narrow frame like the sample
      // Using a two-column pipe with a right wall: "│ … │ █"
      const has0871 = activeEncounters.some(e => e.kind === "087-1" && within(e.absoluteDepth, d));
      const hasAnom = activeEncounters.some(e => e.kind === "anomaly" && within(e.absoluteDepth, d));
      // Check if any team member is in this depth range
      const hasTeam = personnel.some(p => within(p.absoluteDepth, d));

      // Top connector - highlight if current depth
      const topConnector = isCurrentDepth ? `  │ ┌═┴═┐ │ ` : `  │ ┌─┴─┐ │ `;
      out.push({text: topConnector});
      
      // Label line (include personnel/encounter glyphs on left gutter)
      const leftGlyph =
        has0871 ? "☻" :
        hasAnom ? "◉" :
        hasTeam ? "▲" :  // Team indicator (single icon for all personnel)
        isCurrentDepth ? "►" :  // Current depth indicator
        " ";
      
      // Highlight current depth with different border
      const labelLine = isCurrentDepth ? 
        `  │ ${leftGlyph}║${label}║ │` :
        `  │ ${leftGlyph}│${label}│ │`;
      out.push({text: labelLine});
      
      // Bottom connector - highlight if current depth
      const bottomConnector = isCurrentDepth ? `  │  └═┬═┘  │` : `  │  └─┬─┘  │`;
      out.push({text: bottomConnector});
      
      // spine connector
      out.push({text: `  ${f.charge <= f.lowThreshold ? "░" : "│"}    │   ${i < TICKS_VISIBLE - 1 ? "│" : "╵"}`});
    }

    // footer metrics
    out.push({text: `  DEPTH: ${Math.round(depth).toString().padStart(4, " ")} │`});
    out.push({text: `  BATT:  ${String(Math.round((f.charge / f.capacity) * 100)).padStart(3, " ")}%  │`});
    out.push({text: `  VIEW:  ${start}-${start + (TICKS_VISIBLE-1) * STEP} │`});
    const contacts = activeEncounters.length;
    const teamComposition = personnel.map(p => `${p.role.charAt(0)}-${p.level}`).join(" ");
    out.push({text: `TEAM: ${teamComposition}`});
    out.push({text: `DEPTH: ${Math.round(Math.min(...personnel.map(p => p.absoluteDepth)))}-${Math.round(Math.max(...personnel.map(p => p.absoluteDepth)))}`});
    out.push({text: `CONTACTS: ${contacts}`});
    if (contacts > 0) out.push({text: `║ ANOMALOUS READINGS ║`});

    return out;
  }, [depth, f.charge, f.capacity, activeEncounters, personnel, f.lowThreshold, battBar, start]);

  // overlay click mapping (encounters)
  // Map each encounter's absoluteDepth to nearest visible tick Y.
  const overlay = useMemo(() => {
    const map: { id: string; x: number; y: number; label: string; color: string }[] = [];
    const y0 = 7; // first tick starts after header lines
    activeEncounters.forEach(e => {
      const tickIndex = Math.round((e.absoluteDepth - start) / STEP);
      if (tickIndex >= 0 && tickIndex < TICKS_VISIBLE) {
        const y = y0 + tickIndex * 4 + 1; // label line per block
        const x = 4; // left gutter glyph column
        map.push({
          id: e.id,
          x,
          y,
          label: e.kind === "087-1" ? "☻" : "◉",
          color: e.kind === "087-1" ? "#ff6b6b" : "#ffd166",
        });
      }
    });
    return map;
  }, [activeEncounters, start]);

  // Measure monospace char size for overlay positioning
  const [cell, setCell] = useState({w: 8, h: 14});
  const preRef = useRef<HTMLPreElement | null>(null);
  useEffect(() => {
    const el = document.createElement("span");
    el.style.position = "absolute";
    el.style.visibility = "hidden";
    el.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace";
    el.style.fontSize = "12px";
    el.textContent = "M";
    document.body.appendChild(el);
    const r = el.getBoundingClientRect();
    setCell({w: r.width, h: r.height});
    document.body.removeChild(el);
  }, []);

  const containerWidth = Math.max(...rows.map(r => r.text.length)) * cell.w;
  const containerHeight = rows.length * cell.h;

  return (
    <div className="relative rounded-2xl border border-zinc-800 bg-black overflow-hidden max-w-sm">
      {/* scanlines + vignette (2000s vibe) */}
      <div className="pointer-events-none absolute inset-0"
           style={{
             background:
               "linear-gradient(rgba(0,0,0,0.35),rgba(0,0,0,0.35)),repeating-linear-gradient(0deg,rgba(0,0,0,0.15)0px,rgba(0,0,0,0.15)1px,transparent 2px,transparent 3px)",
             boxShadow: "inset 0 0 80px rgba(0,0,0,0.6)"
           }} />
      <div className="p-3">
        <div className="h-80 w-full rounded border border-emerald-500/20 overflow-hidden">
          <div className="relative" style={{ width: containerWidth, height: containerHeight }}>
            <pre
              ref={preRef}
              style={{
                lineHeight: "1.0",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
                fontSize: "11px",
                whiteSpace: "pre",
                color: "#a6ffbe",
                textShadow: "0 0 8px rgba(70,255,120,0.35)",
                margin: 0,
                position: "absolute",
                left: 0, top: 0
              }}
            >
              {rows.map(r => r.text).join("\n")}
            </pre>

            {/* clickable encounters overlay */}
            {overlay.map(o => (
              <button
                key={o.id}
                onClick={() => resolveEncounter(o.id)}
                className="absolute hover:scale-125 transition-transform z-10"
                style={{
                  left: o.x * cell.w,
                  top: o.y * cell.h,
                  color: o.color,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
                  fontSize: "11px",
                  textShadow: "0 0 8px rgba(255,255,255,0.35)",
                  lineHeight: "1",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                aria-label="Resolve encounter"
                title={`Resolve ${o.label === "☻" ? "SCP-087-1" : "anomaly"} encounter`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* LIGHT controls */}
        <div className="mt-3 flex items-center gap-4 text-emerald-200/80 text-[10px] font-mono">
          <div className="flex items-center gap-4">
            <div>DEPTH: <b className="text-emerald-100">{Math.round(depth)}</b></div>
            <div>BATT: <b className="text-emerald-100">{Math.round((f.charge / f.capacity) * 100)}%</b></div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              className="px-2 py-1 rounded border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors text-[9px]"
              onClick={() => toggleFlashlight()}
            >
              {f.on ? "OFF" : "ON"}
            </button>
            <button
              className="px-2 py-1 rounded border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors text-[9px]"
              onClick={() => rechargeFlashlightV2(1)}
            >
              CHARGE
            </button>
          </div>
        </div>

        {/* D-Class Personnel display - Expendable Resources */}
        <div className="mt-3 border-t border-emerald-500/20 pt-2">
          <div className="text-emerald-200/80 text-[9px] font-mono mb-1">D-CLASS ASSIGNMENTS:</div>
          <div className="space-y-1">
            {personnel.map(p => (
              <div
                key={p.id}
                className="flex justify-between w-full text-[8px] font-mono text-emerald-300/60 px-1 py-0.5 border border-emerald-500/10 rounded"
              >
                <span>{p.name}</span>
                <span>{p.role}</span>
                <span>D:{Math.round(p.absoluteDepth)}</span>
                <span className="text-red-400">EXPENDABLE</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
