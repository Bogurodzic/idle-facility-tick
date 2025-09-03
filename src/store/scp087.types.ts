export type EncounterKind = "anomaly" | "087-1";

export interface Encounter {
  id: string;
  x: number;      // column in ASCII grid
  y: number;      // row in ASCII grid (used for overlay click mapping)
  kind: EncounterKind;
  absoluteDepth: number; // depth at which it exists
  expiresAt: number;
  rewardPE: number;
}

export interface Personnel {
  id: string;
  name: string;
  role: "Scout" | "Handler" | "Research";
  absoluteDepth: number; // where the agent is in the stairwell
  lane: "L" | "R";       // render hint (left/right column)
  focus?: boolean;
}

export interface FlashlightState {
  on: boolean;
  charge: number;
  capacity: number;
  drainPerSec: number;
  rechargePerSec: number;
  lowThreshold: number;
}