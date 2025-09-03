import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "../../store/gameStore";
import type { Encounter, Personnel, EncounterKind } from "../../store/scp087.types";
import { Button } from "../ui/button";
import { PersonnelUpgradeModal } from "./PersonnelUpgradeModal";
import { Progress } from "../ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Users, AlertTriangle, Flashlight, FlashlightOff, Battery, Zap } from "lucide-react";

/**
 * Enhanced SCP-087 Terminal Monitor v3.0
 * - Improved UI/UX with integrated controls
 * - Fixed alignment and centering issues
 * - Enhanced symbol display with annotations
 * - Vertical progress bar and integrated deployment
 */

type Props = { width?: number };

const STEP = 34;
const TICKS_VISIBLE = 9;

const pad3 = (n: number) => String(n).padStart(3, "0");

export default function EnhancedStairwellTerminal({ width = 28 }: Props) {
  const scp087 = useGameStore(state => state.scp087);
  const toggleFlashlight = useGameStore(state => state.toggleFlashlight);
  const drainFlashlight = useGameStore(state => state.drainFlashlight);
  const rechargeFlashlightV2 = useGameStore(state => state.rechargeFlashlightV2);
  const manualChargeFlashlight = useGameStore(state => state.manualChargeFlashlight);
  const movePersonnel = useGameStore(state => state.movePersonnel);
  const spawnEncounterAtDepth = useGameStore(state => state.spawnEncounterAtDepth);
  const resolveEncounter = useGameStore(state => state.resolveEncounter);
  const cullExpiredEncounters = useGameStore(state => state.cullExpiredEncounters);
  const toggleTeamExploration = useGameStore(state => state.toggleTeamExploration);
  
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [recentEncounter, setRecentEncounter] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  // Handle legacy store format
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
  
  const activeEncounters: Encounter[] = scp087?.activeEncounters?.map((e: any) => {
    if ('kind' in e) {
      return e as Encounter;
    } else {
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

  useEffect(() => {
    if (Date.now() - scp087.lastEncounter < 3000) {
      setRecentEncounter(true);
      const timer = setTimeout(() => setRecentEncounter(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [scp087.lastEncounter]);

  if (!scp087) {
    return <div className="p-4 text-terminal-green font-mono">Initializing SCP-087 Terminal...</div>;
  }

  const depth = scp087.currentDepth || scp087.depth || 0;
  const f = flashlight;

  const [t, setT] = useState(0);
  const raf = useRef<number | null>(null);

  // Animation/update loop
  useEffect(() => {
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      setT(p => p + dt);

      if (f.on && f.charge > 0) drainFlashlight(dt); 
      else if (!f.on && scp087.upgrades.autoRecharge?.owned > 0) {
        rechargeFlashlightV2(dt * 0.7);
      }
      movePersonnel(dt);
      cullExpiredEncounters();

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

  const anchor = Math.floor(depth / STEP) * STEP;
  const start = anchor - Math.floor(TICKS_VISIBLE / 2) * STEP;

  // Battery bar (12 cells for better resolution)
  const battCells = 12;
  const battFill = Math.round((f.charge / f.capacity) * battCells);
  const battBar = "█".repeat(Math.max(0, Math.min(battCells, battFill))) +
                  "░".repeat(Math.max(0, battCells - battFill));

  // Enhanced vertical progress calculation for team deployment
  const deployProgress = scp087.teamDeployed ? ((Date.now() % 3000) / 3000) * 100 : 0;
  const verticalProgressChars = "▁▂▃▄▅▆▇█";
  const progressIndex = Math.floor((deployProgress / 100) * (verticalProgressChars.length - 1));
  const progressChar = scp087.teamDeployed ? 
    `${verticalProgressChars[progressIndex]}` : 
    "█"; // Always show full bar when not deployed for visibility
  const progressColor = scp087.teamDeployed ? "text-terminal-green" : "text-muted-foreground";

  // Calculate current speed for display
  const baseSpeed = 5;
  const currentSpeed = f.on && f.charge > 0 ? baseSpeed : baseSpeed * 0.6;
  const speedPercent = Math.round((currentSpeed / baseSpeed) * 100);

  // Enhanced rendering with improved alignment and annotations
  type Row = { text: string; annotations?: string };
  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];

    // Enhanced header with speed display and flashlight upgrade info
    out.push({text: "╔════ SCP-087 TERMINAL v3.0 ════╗"});
    out.push({text: "║ █ SECURE ██ CONTAIN ██ PROTECT ║"});
    out.push({text: "╠════════════════════════════════╣"});
    const flashStatus = f.on ? "◉ ON " : "○ OFF";
    const lightEffect = f.on ? "████" : "░░░░";
    
    // Flashlight upgrade info for header
    const batteryUpgrade = scp087.upgrades.advancedBattery;
    const upgradeLevel = batteryUpgrade?.owned || 0;
    const upgradeSuffix = upgradeLevel > 0 ? ` L${upgradeLevel}` : "";
    
    out.push({text: `║ FLASHLIGHT: ${flashStatus} [${battBar}]${upgradeSuffix.padEnd(4, " ")} ║`});
    out.push({text: `║ BEAM: ${lightEffect}  DEPTH: ${String(Math.round(depth)).padStart(5, " ")}m  TEAM: ${scp087.teamDeployed ? "ACTIVE" : "IDLE"} ║`});
    out.push({text: `║ SPEED: ${currentSpeed.toFixed(1)}m/s (${speedPercent}%)  PROGRESS: ${scp087.teamDeployed ? "DESCENDING" : "STANDBY"} ║`});
    out.push({text: "╠════════════════════════════════╣"});
    
    const within = (abs: number, tick: number) => {
      const top = tick - STEP / 2;
      const bot = tick + STEP / 2;
      return abs >= top && abs < bot;
    };

    // Build enhanced tick blocks
    for (let i = 0; i < TICKS_VISIBLE; i++) {
      const d = start + i * STEP;
      const label = pad3(Math.max(0, d));
      const isCurrentDepth = within(depth, d);
      
      const has0871 = activeEncounters.some(e => e.kind === "087-1" && within(e.absoluteDepth, d));
      const hasAnom = activeEncounters.some(e => e.kind === "anomaly" && within(e.absoluteDepth, d));
      const hasTeam = personnel.some(p => within(p.absoluteDepth, d));
      
      // Get encounter details for annotations
      const encounter087 = activeEncounters.find(e => e.kind === "087-1" && within(e.absoluteDepth, d));
      const encounterAnom = activeEncounters.find(e => e.kind === "anomaly" && within(e.absoluteDepth, d));
      const teamMember = personnel.find(p => within(p.absoluteDepth, d));

      // Enhanced progress bar on left side - always visible, animated when active
      const progressCol = progressChar;
      
      // Enhanced top connector
      const topConnector = isCurrentDepth ? 
        `${progressCol} ╓───┴───╖ ` : 
        `${progressCol} ┌───┴───┐ `;
      out.push({text: topConnector});
      
      // Enhanced label line with better centering and always show team
      let annotations = "";
      let centerChar = " ";
      
      // Priority: Show team ALWAYS, then add encounter info to annotations
      if (hasTeam && teamMember) {
        centerChar = "▲";
        annotations = ` ◄─── ${teamMember.name} (${teamMember.role})`;
        
        // Add encounter info to team annotation
        if (has0871) {
          annotations += ` + SCP-087-1! (+${encounter087?.rewardPE || 150}PE)`;
        } else if (hasAnom) {
          annotations += ` + ANOMALY (+${encounterAnom?.rewardPE || 40}PE)`;
        }
      } else if (has0871) {
        centerChar = "☻";
        annotations = ` ◄─── SCP-087-1! (+${encounter087?.rewardPE || 150}PE)`;
      } else if (hasAnom) {
        centerChar = "◉";
        annotations = ` ◄─── ANOMALY (+${encounterAnom?.rewardPE || 40}PE)`;
      } else if (isCurrentDepth) {
        centerChar = "►";
        annotations = ` ◄─── CURRENT POSITION`;
      }
      const labelLine = isCurrentDepth ? 
        `${progressCol} ║ ${centerChar} ${label} ${centerChar} ║${annotations}` :
        `${progressCol} │ ${centerChar} ${label} ${centerChar} │${annotations}`;
      
      out.push({text: labelLine, annotations});
      
      // Enhanced bottom connector  
      const bottomConnector = isCurrentDepth ? 
        `${progressCol} ╙───┬───╜ ` : 
        `${progressCol} └───┬───┘ `;
      out.push({text: bottomConnector});
      
      // Spine with battery indicator and flashlight beam effect
      const spine = f.charge <= f.lowThreshold ? "░" : "║";
      const beamEffect = f.on && f.charge > 0 ? "≈" : " ";
      out.push({text: `${progressCol}  ${beamEffect}  ${spine}  ${beamEffect}  ${i < TICKS_VISIBLE - 1 ? "║" : "╨"}`});
    }

    // Enhanced footer with team status
    const teamComposition = personnel.map(p => `${p.role.charAt(0)}${p.level}`).join(" ");
    const teamDepthRange = personnel.length > 0 ? 
      `${Math.round(Math.min(...personnel.map(p => p.absoluteDepth)))}-${Math.round(Math.max(...personnel.map(p => p.absoluteDepth)))}m` : 
      "NO TEAM";
    
    out.push({text: "╠════════════════════════════════╣"});
    out.push({text: `║ TEAM: ${teamComposition.padEnd(8, " ")} RANGE: ${teamDepthRange.padEnd(10, " ")} ║`});
    out.push({text: `║ CONTACTS: ${String(activeEncounters.length).padStart(2, " ")}  BATTERY: ${String(Math.round((f.charge / f.capacity) * 100)).padStart(3, " ")}% ║`});
    
    if (activeEncounters.length > 0) {
      out.push({text: "║ ⚠  ANOMALOUS READINGS DETECTED  ⚠ ║"});
    }
    
    out.push({text: "╚════════════════════════════════╝"});

    return out;
  }, [depth, f.charge, f.capacity, activeEncounters, personnel, f.lowThreshold, battBar, start, scp087.teamDeployed, progressChar]);

  // Enhanced overlay for clickable encounters
  const overlay = useMemo(() => {
    const map: { id: string; x: number; y: number; label: string; color: string; type: string }[] = [];
    const y0 = 6; // First tick starts after header
    
    activeEncounters.forEach(e => {
      const tickIndex = Math.round((e.absoluteDepth - start) / STEP);
      if (tickIndex >= 0 && tickIndex < TICKS_VISIBLE) {
        const y = y0 + tickIndex * 4 + 1; // Label line per block
        const x = 4; // Center position
        map.push({
          id: e.id,
          x, y,
          label: e.kind === "087-1" ? "☻" : "◉",
          color: e.kind === "087-1" ? "#ff4757" : "#ffa502",
          type: e.kind === "087-1" ? "SCP-087-1" : "Anomaly",
        });
      }
    });
    return map;
  }, [activeEncounters, start]);

  // Measure character dimensions
  const [cell, setCell] = useState({w: 8, h: 16});
  const preRef = useRef<HTMLPreElement | null>(null);
  
  useEffect(() => {
    const el = document.createElement("span");
    el.style.position = "absolute";
    el.style.visibility = "hidden";
    el.style.fontFamily = "'JetBrains Mono', 'Consolas', 'Monaco', monospace";
    el.style.fontSize = "11px";
    el.style.lineHeight = "1.2";
    el.textContent = "M";
    document.body.appendChild(el);
    const r = el.getBoundingClientRect();
    setCell({w: r.width, h: r.height});
    document.body.removeChild(el);
  }, []);

  const handleDeployTeam = () => {
    setIsDeploying(true);
    toggleTeamExploration();
    setTimeout(() => setIsDeploying(false), 1000);
  };

  // Memoized flashlight button to prevent flickering
  const flashlightButton = useMemo(() => {
    const isDepleted = f.charge === 0;
    const speedEffect = f.on && !isDepleted ? 100 : 60;
    const drainRate = f.on && !isDepleted ? "6.0/s" : "0/s";
    const autoRechargeLevel = scp087.upgrades.autoRecharge?.owned || 0;
    const rechargeRate = !f.on && autoRechargeLevel > 0 ? `${22 + (autoRechargeLevel - 1) * 5}/s` : "0/s";
    const encountersActive = f.on && !isDepleted ? "Active" : "None";
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={isDepleted ? "destructive" : f.on ? "default" : "outline"}
              onClick={() => {
                if (isDepleted) {
                  // Prevent toggling when depleted
                  return;
                }
                toggleFlashlight();
              }}
              disabled={isDepleted}
              className={`font-mono text-xs transition-all duration-300 ${
                isDepleted
                  ? "bg-destructive/20 text-destructive border-destructive/40 hover:bg-destructive/30"
                  : f.on 
                    ? "bg-terminal-green/20 text-terminal-green border-terminal-green/40 hover:bg-terminal-green/30" 
                    : "border-muted-foreground/40 hover:border-terminal-green/40"
              }`}
            >
              <div className="flex items-center gap-1">
                {isDepleted ? <FlashlightOff className="w-3 h-3" /> : f.on ? <Flashlight className="w-3 h-3" /> : <FlashlightOff className="w-3 h-3" />}
                <span>FLASHLIGHT: {isDepleted ? "DEPLETED" : f.on ? "ON" : "OFF"}</span>
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <div className="font-mono text-terminal-green">FLASHLIGHT EFFECTS:</div>
              <div>• Speed: {speedEffect}% {f.on ? "(Full)" : "(Reduced)"}</div>
              <div>• Encounters: {encountersActive}</div>
              <div>• Battery Drain: {drainRate}</div>
              <div>• Recharge Rate: {rechargeRate}</div>
              <div className="text-muted-foreground mt-2">
                {f.on ? "Turn OFF to save battery but reduce speed" : "Turn ON for full speed and encounters"}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }, [f.on, f.charge, toggleFlashlight]);

  // Memoized charge button with enhanced info
  const chargeButton = useMemo(() => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="outline"  
            onClick={manualChargeFlashlight}
            className="font-mono text-xs hover:border-yellow-500/40 hover:text-yellow-400 transition-colors"
            disabled={f.charge >= f.capacity}
          >
            <div className="flex items-center gap-1">
              {f.charge < f.capacity ? <Zap className="w-3 h-3" /> : <Battery className="w-3 h-3" />}
              <span>CHARGE</span>
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs space-y-1">
            <div className="font-mono">BATTERY STATUS:</div>
            <div>Current: {Math.round(f.charge)}% / {f.capacity}%</div>
            <div>Rate: +{f.rechargePerSec}/s when OFF</div>
            {f.charge >= f.capacity && <div className="text-green-400">Fully charged!</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ), [f.charge, f.capacity, f.rechargePerSec, rechargeFlashlightV2]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.floor(num).toString();
  };

  return (
    <div className="space-y-4">
      {/* Main Terminal Display */}
      <div className={`relative rounded-lg border-2 transition-all duration-500 overflow-hidden ${
        f.on 
          ? "border-terminal-green/40 bg-terminal-bg shadow-[0_0_20px_hsl(var(--terminal-green)_/_0.3)]" 
          : "border-terminal-green/20 bg-terminal-bg/80 shadow-[0_0_10px_hsl(var(--terminal-green)_/_0.1)]"
      }`}>
        {/* CRT Effects with dynamic lighting */}
        <div 
          className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
            f.on ? "opacity-70" : "opacity-40"
          }`}
          style={{
            background: `
              radial-gradient(ellipse at center, transparent 0%, hsl(var(--terminal-green) / ${f.on ? 0.08 : 0.03}) 100%),
              var(--scanlines)
            `,
            boxShadow: `
              inset 0 0 100px hsl(var(--terminal-green) / ${f.on ? 0.15 : 0.05}),
              0 0 20px hsl(var(--terminal-green) / ${f.on ? 0.4 : 0.2})
            `
          }} 
        />
        
        <div className="p-4">
          <div className={`relative rounded border p-2 transition-all duration-500 ${
            f.on 
              ? "bg-black/60 border-terminal-green/30" 
              : "bg-black/80 border-terminal-green/15"
          }`}>
            <pre
              ref={preRef}
              className={`font-mono text-xs leading-tight whitespace-pre select-none transition-all duration-500 ${
                f.on 
                  ? "text-terminal-green terminal-glow" 
                  : "text-terminal-green/60"
              }`}
              style={{
                fontFamily: "'JetBrains Mono', 'Consolas', 'Monaco', monospace",
                fontSize: "11px",
                lineHeight: "1.2",
                textShadow: f.on 
                  ? "0 0 5px currentColor, 0 0 10px currentColor" 
                  : "0 0 2px currentColor"
              }}
            >
              {rows.map((r, i) => r.text).join("\n")}
            </pre>

            {/* Clickable encounters overlay */}
            {overlay.map(o => (
              <button
                key={o.id}
                onClick={() => resolveEncounter(o.id)}
                className="absolute hover:scale-150 transition-all duration-200 z-10 animate-pulse"
                style={{
                  left: o.x * cell.w + 8,
                  top: o.y * cell.h + 8,
                  color: o.color,
                  fontFamily: "'JetBrains Mono', 'Consolas', 'Monaco', monospace",
                  fontSize: "11px",
                  textShadow: `0 0 10px ${o.color}, 0 0 20px ${o.color}`,
                  lineHeight: "1.2",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                title={`Click to resolve ${o.type} (+${o.type === "SCP-087-1" ? "150" : "40"}PE)`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Integrated Control Panel */}
      <div className="grid grid-cols-2 gap-4">
        {/* Resources Display */}
        <div className="space-y-2">
          <div className="bg-card border border-terminal-green/20 p-3 rounded">
            <div className="text-xs text-muted-foreground">Paranoia Energy</div>
            <div className="text-lg font-mono text-scp-087 terminal-glow">
              {formatNumber(scp087.paranoiaEnergy)}
            </div>
          </div>
        </div>

        {/* Team Controls */}
        <div className="space-y-2">

          {/* Encounter Alert */}
          {recentEncounter && (
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-destructive animate-pulse" />
                <span className="text-xs text-destructive">087-1 Encountered!</span>
              </div>
            </div>
          )}

          {/* Deploy Button */}
          <Button 
            onClick={handleDeployTeam}
            className="w-full font-mono text-xs"
            disabled={recentEncounter || isDeploying}
            variant={scp087.teamDeployed ? "destructive" : "default"}
          >
            {recentEncounter 
              ? "RECOVERING..." 
              : isDeploying
                ? "DEPLOYING..."
              : scp087.teamDeployed 
                ? "◄◄ RECALL TEAM" 
                : "►► DEPLOY TEAM"
            }
          </Button>

          {/* Enhanced Flashlight Controls */}
          <div className="grid grid-cols-2 gap-2">
            {flashlightButton}
            {chargeButton}
          </div>
        </div>
      </div>

      {/* Personnel Panel */}
      <div className="bg-card border border-terminal-green/20 rounded p-3">
        <div className="text-xs text-muted-foreground mb-2 font-mono">PERSONNEL ROSTER:</div>
        <div className="space-y-1">
          {personnel.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPersonnel(p)}
              className="flex justify-between w-full text-xs font-mono text-muted-foreground hover:text-terminal-green hover:bg-terminal-green/10 rounded px-2 py-1 transition-colors border border-transparent hover:border-terminal-green/20"
            >
              <span className="truncate">{p.name}</span>
              <span>{p.role}</span>
              <span>L{p.level}</span>
              <span>{Math.round(p.absoluteDepth)}m</span>
              <span className={p.lane === "L" ? "text-blue-400" : "text-orange-400"}>{p.lane}</span>
              <span className={p.active ? "text-terminal-green" : "text-gray-500"}>
                {p.active ? "●" : "○"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <PersonnelUpgradeModal
        personnel={selectedPersonnel}
        isOpen={!!selectedPersonnel}
        onClose={() => setSelectedPersonnel(null)}
      />
    </div>
  );
}