# Wasp Hive Design

**Goal:** Add a destructible wasp hive to the map — an alternate win condition, the physical origin of all wasp waves, and a honey-fuelled escalating threat.

**Architecture:** A `WaspHiveSystem` coordinator owns the `WaspHive` entity, wave spawning, honey-scaling, and HP regen. `WaveManager` stays unchanged. GameScene routes wave events through `WaspHiveSystem` instead of `_spawnWave`.

**Tech Stack:** Phaser 3.87, Vite 5, Vitest 2, vanilla JS

**Series:** Plan 5 of N.

---

## Data Model (`constants.js`)

```js
WASP_HIVE: {
  HP: 30,                // 3× player hive — hard to kill
  REGEN_INTERVAL: 10000, // ms between regen ticks
  REGEN_BASE: 0.5,       // HP per tick baseline
  REGEN_PER_HONEY: 0.1,  // extra HP/tick per 20 honey stolen (uncapped)
}
```

---

## WaspHive Entity (`src/entities/WaspHive.js`)

Pure Phaser sprite — no logic, just state.

- Placed at a random position each run: ≥800px from player hive, ≥200px from map edges
- `hp = WASP_HIVE.HP`, `maxHp = WASP_HIVE.HP`
- `takeDamage(amount)` — reduces HP, flashes red, returns `true` if destroyed
- No minimap indicator — player must explore to find it

---

## WaspHiveSystem (`src/systems/WaspHiveSystem.js`)

```js
constructor({ scene, playerHiveX, playerHiveY, onDestroyed })
update(time, delta)       // regen tick using stolen honey
spawnWave(waveSpec)       // applies honey scaling, spawns at hive, assigns flanking
onHoneyStolen(amount)     // called by GameScene on every steal event
get hive()                // WaspHive entity reference (for stinger overlap)
```

### HP Regen

Fires every `WASP_HIVE.REGEN_INTERVAL` ms:

```
regenAmount = REGEN_BASE + Math.floor(totalHoneyStolen / 20) * REGEN_PER_HONEY
```

More stolen honey → faster regen → harder to finish off. Never exceeds maxHp.

### Wave Spawning

All wasps spawn at the WaspHive position. Honey scaling applied before spawning:

```
countMult   = 1 + Math.floor(totalHoneyStolen / 50) * 0.15   // +15% per 50 honey, cap 3×
powerChance = Math.min(0.6, totalHoneyStolen / 200)           // up to 60% powered wasps
```

A **powered wasp** has `hp = 2` and speed `+25%`. Set as properties on spawn — no new class.

### Flanking

50% of wasps per wave receive a flank waypoint. Calculation:

1. Compute angle from WaspHive → player hive
2. Rotate that angle by a random 90–150° (left or right, chosen per wasp)
3. Extend the rotated vector to the map edge — that point is the waypoint

The wasp travels to the waypoint first, then switches to normal attack targeting once within 50px.

---

## HunterWasp & RaiderWasp Changes

Both get `setFlankWaypoint(x, y)`:

- While waypoint exists: move toward it at normal speed
- Once within 50px: clear waypoint, resume normal targeting
- Waypoint travel ignores the player (no mid-route targeting switch)

---

## Honey Tracking

GameScene calls `waspHiveSystem.onHoneyStolen(amount)` on every steal event:

| Event | Amount |
|-------|--------|
| Hunter steals sap from player | `WASP.SAP_STEAL` |
| Raider steals honey from hive | `WASP.HONEY_STEAL` |

Both already fire inside GameScene collision handlers.

---

## Win Conditions

| Condition | How | GameOverScene headline |
|-----------|-----|----------------------|
| Survive 10 minutes | Timer expires | `YOU WIN!` |
| Destroy wasp hive | WaspHive HP → 0 | `WASP HIVE DESTROYED` |
| Hive destroyed | Player hive HP → 0 | `HIVE DESTROYED` |

`GameScene._endGame(won, wonByDestruction?)` passes flag to GameOverScene. Jelly/score flow is unchanged.

---

## GameScene Changes

- Create `WaspHiveSystem` in `create()` after hive/player initialised
- Delete `_spawnWave()` and `_edgePoint()` — replaced by `waspHiveSystem.spawnWave()`
- Call `waspHiveSystem.update(time, delta)` in update loop
- Add `this.physics.add.overlap(this.stingers, waspHiveGroup, ...)` where `waspHiveGroup` is a static group containing the WaspHive sprite
- Add `waspHiveSystem.onHoneyStolen()` calls in the two steal collision handlers

---

## File Map

```
src/entities/WaspHive.js          CREATE
src/systems/WaspHiveSystem.js     CREATE
src/entities/HunterWasp.js        MODIFY — setFlankWaypoint, waypoint travel in update()
src/entities/RaiderWasp.js        MODIFY — setFlankWaypoint, waypoint travel in update()
src/scenes/GameScene.js           MODIFY — wire WaspHiveSystem, remove _spawnWave/_edgePoint, honey callbacks, stinger overlap
src/scenes/GameOverScene.js       MODIFY — wonByDestruction headline
src/constants.js                  MODIFY — add WASP_HIVE block
```

---

## Testing

`WaspHiveSystem.test.js` (pure-JS, no Phaser):

- `onHoneyStolen` accumulates correctly
- `countMult` scales correctly at 0, 50, 100, 200 honey
- `powerChance` caps at 0.6 at 200+ honey
- Regen amount formula at 0 and 100 stolen honey
- `spawnWave` returns correct powered/direct/flank counts (mock scene)
