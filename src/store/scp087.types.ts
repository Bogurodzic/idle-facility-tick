export type EncounterKind = "anomaly" | "087-1";

export interface Encounter {
  id: string;
  x: number;      // column in ASCII grid
  y: number;      // row in ASCII grid (used for overlay click mapping)
  kind: EncounterKind;
  absoluteDepth: number; // depth at which it exists
  expiresAt: number;
  rewardPE: number;
  blocking: boolean;    // whether this encounter blocks personnel progression
  inProgress: boolean;  // whether collection/investigation is active
  progressStarted?: number; // timestamp when collection/investigation started
  duration?: number;    // how long collection/investigation takes (ms)
  casualtyRate?: number; // chance of D-Class casualties during this encounter
  requiredDClass?: number; // minimum D-Class needed for this encounter
}

export interface Personnel {
  id: string;
  name: string;
  role: "Scout" | "Handler" | "Research";
  absoluteDepth: number; // where the agent is in the stairwell
  lane: "L" | "R";       // render hint (left/right column)
  focus?: boolean;
  level: number;
  experience: number;
  speed: number;         // movement speed modifier
  survivalRate: number;  // chance to survive encounters
  active: boolean;       // whether they're currently exploring
  status: "active" | "resting" | "lost" | "injured" | "blocked";
  blockedBy?: string;    // ID of encounter blocking this personnel
  assignedDClass?: number; // number of D-Class assigned to this personnel
}

export interface FlashlightState {
  on: boolean;
  charge: number;
  capacity: number;
  drainPerSec: number;
  rechargePerSec: number;
  lowThreshold: number;
}