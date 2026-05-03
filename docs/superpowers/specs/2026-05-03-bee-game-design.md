# Bee Game — Design Spec
*2026-05-03*

## Overview

Top-down 2D survival game built with Phaser.js. Player controls a bee protecting a hive from wasp raids. Collect pollen and sap, produce honey, build defenses, survive a timed run. Roguelike meta-progression between runs.

---

## Core Loop

```
START RUN
  → meta bonuses applied as baseline stats
  → player places hive on map
  → timer begins (target: ~10 minutes, tunable)

COLLECT PHASE
  → fly to flower → auto-collect pollen on overlap
  → pollen auto-used on collection: pollinates nearby area → new flowers spawn over time
  → fly to flower → auto-collect sap on overlap (stored in carry capacity)
  → fly back to hive → deposit sap → converts to honey over time
  → wasps can intercept player en route and steal carried sap (not pollen)

DEFEND PHASE (ongoing, escalating waves)
  → Hunter wasps: chase bees, steal carried sap → then drain bee HP
  → Raider wasps: beeline to hive, steal honey → then drain hive HP
  → player bee auto-fires stingers at nearest wasp

SPEND HONEY (at hive, opens pause/build menu)
  → place defense towers on map
  → upgrade player bee stats
  → recruit worker bees
  → upgrade hive

LOSE: honey stolen to 0 → hive HP drains to 0 → game over
WIN:  survive full timer

END OF RUN
  → score calculated → meta points awarded
  → meta upgrade screen → persistent bonuses purchased
```

---

## Two-Layer Defense (symmetric)

Both the player bee and the hive use the same two-layer system:

**Player Bee:** wasps hit → steal carried sap first → no sap = drain bee HP → HP 0 = death → respawn costs honey

**Hive:** raider wasps attack → steal honey first → honey 0 = drain hive HP → hive HP 0 = game over

Honey is doubly precious: it funds all purchases AND shields the hive. Dying as a bee bleeds honey too.

---

## Resources

| Resource | Source | Used For |
|---|---|---|
| Pollen | Flowers (auto-collect on overlap) | Auto-used on pickup → pollinates nearby area → spawns new flowers |
| Sap | Flowers (auto-collect on overlap, carried) | Deposited at hive → converts to honey |
| Honey | Sap converted at hive over time | Towers, upgrades, worker bees, bee respawn |
| Meta Points | Earned at end of run via score | Permanent upgrades between runs |

---

## Entities

### Player Bee
- WASD / arrow key movement
- Auto-fires stingers at nearest wasp
- Pollen auto-used on pickup (triggers pollination); sap carried back to hive
- Has carry capacity for sap; two-layer wasp interaction (steal sap → drain HP)
- Dies at HP 0; respawn at hive costs honey

### Worker Bee
- Autonomous; pathfinds to nearest unclaimed flower
- Collects sap/pollen, returns to hive, repeats
- Same two-layer steal/HP system as player bee
- Purchased with honey; count capped by hive worker slots

### Flower
- Resource node with pollen + sap
- Pollinated by player bee or butterfly → spawns child flowers nearby over time
- Can have spider webs placed across them

### Hive
- Fixed base placed by player at start of run
- Stores honey (capped by storage upgrade)
- Has HP; two-layer wasp interaction (steal honey → drain HP)
- Opens build/upgrade menu when player overlaps

### Defense Towers (placed on map, cost honey, no refund)
| Tower | Effect |
|---|---|
| Stinger Turret | Auto-shoots nearest wasp in range |
| Resin Trap | Slows wasps passing over it |
| Guard Bee Post | Spawns temporary guard bees when wasps are nearby |

*These are starter towers. Design is intentionally open for wilder upgrade ideas.*

### Hunter Wasp
- Targets player bee and worker bees
- Steals carried sap on contact; attacks HP when bee carries nothing
- Spawns from map edges

### Raider Wasp
- Ignores bees; beelines directly to hive
- Steals honey on contact; attacks hive HP when honey is 0
- Spawns from map edges

### Spider (passive, neutral hazard)
- Builds webs across flowers over time
- Any entity (bee or wasp) entering web loses all momentum instantly
- Can push through web to break it, but must rebuild speed from zero
- Tactically useful: wasps get caught too

### Wind (environmental)
- Global force vector applied to all flying entities each tick
- Direction and strength shift on a timer
- Tailwind = speed boost, headwind = slowdown, crosswind = drift
- Adds skill expression to routing decisions

### Butterfly (passive, friendly)
- Wanders the map
- Auto-pollinates flowers it passes over
- Player can loosely herd butterflies toward flower clusters

---

## Wasp Waves

- Spawn from map edges on escalating schedule
- Early waves: hunters only
- Mid waves: raiders introduced, mixed compositions
- Late waves: faster, larger, mixed hunter+raider simultaneously
- Wave manager drives escalation; parameters tunable

---

## Upgrades

### Player Bee (bought at hive with honey)
| Upgrade | Effect |
|---|---|
| Carry Capacity | More sap/pollen per trip |
| Speed | Faster movement |
| Stinger Damage | More damage per shot |
| Stinger Rate | Faster auto-fire |
| HP | More hits before death |
| Armor | First hit steals less sap |

*Intentionally open for wilder upgrade ideas.*

### Hive (bought at hive with honey)
| Upgrade | Effect |
|---|---|
| Honey Storage | Higher max honey cap |
| Honey Production | Faster sap→honey conversion |
| Hive HP | More hits after honey depleted |
| Worker Slots | Max number of worker bees |

### Meta Upgrades (permanent, bought between runs with meta points)
Passive bonuses that apply as baseline stats at the start of every run. Examples:
- Start with bonus HP
- Faster base movement speed
- Bonus honey on spawn
- Extra worker bee slot
- Reduced respawn cost

*List is intentionally open-ended for expansion.*

---

## Scoring

Score calculated at end of run:
- Time survived
- Wasps killed
- Honey produced (total, not current)
- Flowers pollinated
- Worker bees active at death/win

Score converts to meta points at a fixed rate.

---

## Technical Architecture

**Stack:** Phaser.js (Arcade Physics), HTML5 Canvas, vanilla JS

### Scenes
```
BootScene         → load all assets
MenuScene         → start run, view meta upgrades
PlacementScene    → player places hive on map
GameScene         → all gameplay
PauseScene        → overlay: build towers, buy upgrades
GameOverScene     → score, meta points earned
MetaUpgradeScene  → spend meta points, persist to localStorage
```

### GameScene Structure
- **Tilemap** — world layout (grass, flower tiles, sap node tiles)
- **Physics Groups** — `bees`, `wasps`, `towers`, `projectiles`, `flowers`, `webs`
- **Wind system** — global force vector, shifts on timer, applied each update tick
- **Wave manager** — spawns wasp waves on escalating schedule
- **Resource manager** — tracks pollen/sap carried by each bee, honey in hive
- **UI overlay** — honey count, timer, bee HP bar, hive HP bar, carried resources

### Entity Pattern
Each entity = extended Phaser `GameObject` with `update()` method. AI entities (wasps, worker bees, butterflies, spiders) use simple state machines.

### Persistence
`localStorage` — stores meta upgrade levels between sessions. No server required.

---

## Out of Scope (this version)
- Multiplayer
- Sound design / music (placeholder only)
- Mobile / touch controls
- More than one map layout
