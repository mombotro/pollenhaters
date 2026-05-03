# Bee Game — Plan 1: Core Playable Loop

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable core loop — player bee collects sap from flowers, deposits at hive to produce honey, survives escalating wasp waves for 10 minutes.

**Architecture:** Phaser 3 scene-based game with Arcade Physics. Pure-logic systems (ResourceManager, WaveManager, PollinationSystem) are framework-agnostic JS classes tested with Vitest. Entity classes extend Phaser.Physics.Arcade.Sprite. All constants centralized in `constants.js`.

**Tech Stack:** Phaser 3.87, Vite 5, Vitest 2, HTML5 Canvas, vanilla JS

**Series:** Plan 1 of 4. Plan 2 = defense systems (towers, worker bees). Plan 3 = passive world (spiders, wind, butterflies). Plan 4 = meta-progression.

---

## File Map

```
bee-game/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js                        Phaser.Game config, scene list
│   ├── constants.js                   All tunable numbers
│   ├── scenes/
│   │   ├── BootScene.js               Generate placeholder textures → MenuScene
│   │   ├── MenuScene.js               Title + start button
│   │   ├── PlacementScene.js          Click to place hive → GameScene
│   │   ├── GameScene.js               All gameplay: entities, systems, collisions
│   │   ├── PauseScene.js              Stub (Plan 2)
│   │   ├── GameOverScene.js           Win/lose message, score, restart
│   │   └── MetaUpgradeScene.js        Stub (Plan 4)
│   ├── entities/
│   │   ├── PlayerBee.js               WASD movement, auto-fire, sap carry, HP
│   │   ├── Flower.js                  Sap node, pollen pickup, pollination trigger
│   │   ├── Hive.js                    Deposit zone, honey storage, HP layers
│   │   ├── Stinger.js                 Projectile: velocity toward target
│   │   ├── HunterWasp.js              Chases bees, steals sap → HP
│   │   └── RaiderWasp.js              Chases hive, steals honey → hive HP
│   ├── systems/
│   │   ├── ResourceManager.js         Pure JS: sap carried, honey, steal, spend
│   │   ├── WaveManager.js             Pure JS: wave schedule, escalation
│   │   └── PollinationSystem.js       Pure JS: delayed flower spawns
│   └── ui/
│       └── HUD.js                     Fixed-camera overlay: honey, timer, HP bars
└── tests/
    ├── ResourceManager.test.js
    ├── WaveManager.test.js
    └── PollinationSystem.test.js
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `index.html`
- Create: `package.json`
- Create: `vite.config.js`

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Bee Game</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
  </style>
</head>
<body>
  <div id="game"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "bee-game",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "phaser": "^3.87.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 3: Create vite.config.js**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 5: Commit**

```bash
git init
git add index.html package.json vite.config.js package-lock.json
git commit -m "chore: project scaffold — Phaser 3, Vite, Vitest"
```

---

### Task 2: Constants

**Files:**
- Create: `src/constants.js`

- [ ] **Step 1: Create src/constants.js**

```js
export const WORLD = {
  WIDTH: 2560,
  HEIGHT: 1440,
};

export const BEE = {
  SPEED: 200,
  HP: 5,
  SAP_CAPACITY: 10,
  STINGER_RATE: 800,         // ms between auto-fire shots
  STINGER_SPEED: 400,
  STINGER_DAMAGE: 1,
  STINGER_RANGE: 200,
  RESPAWN_COST: 20,
};

export const HIVE = {
  HP: 10,
  HONEY_STORAGE: 100,
  SAP_CONVERSION_RATE: 1,    // honey per sap unit
  SAP_CONVERSION_INTERVAL: 2000, // ms between conversions (converts 1 sap at a time)
};

export const WASP = {
  HUNTER_SPEED: 150,
  RAIDER_SPEED: 120,
  HP: 3,
  SAP_STEAL: 3,
  HONEY_STEAL: 5,
  DAMAGE: 1,
  HIT_COOLDOWN: 1000,        // ms between hits from same wasp
};

export const WAVE = {
  FIRST_WAVE_DELAY: 15000,
  WAVE_INTERVAL: 30000,
  BASE_COUNT: 3,
  COUNT_INCREMENT: 2,
};

export const FLOWER = {
  SAP_AMOUNT: 5,
  POLLINATION_RADIUS: 150,
  SPAWN_DELAY: 6000,
  INITIAL_COUNT: 20,
};

export const TIMER = {
  RUN_DURATION: 600000,      // 10 minutes
};
```

- [ ] **Step 2: Commit**

```bash
git add src/constants.js
git commit -m "feat: game constants"
```

---

### Task 3: ResourceManager (with tests)

**Files:**
- Create: `src/systems/ResourceManager.js`
- Create: `tests/ResourceManager.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/ResourceManager.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import ResourceManager from '../src/systems/ResourceManager.js';

describe('ResourceManager', () => {
  let rm;

  beforeEach(() => {
    rm = new ResourceManager({ honeyStorage: 100, sapConversionRate: 1 });
  });

  it('starts with zero sap carried and zero honey', () => {
    expect(rm.getSapCarried('player')).toBe(0);
    expect(rm.getHoney()).toBe(0);
  });

  it('adds sap up to capacity', () => {
    rm.addSap('player', 5, 10);
    expect(rm.getSapCarried('player')).toBe(5);
  });

  it('caps sap at capacity', () => {
    rm.addSap('player', 15, 10);
    expect(rm.getSapCarried('player')).toBe(10);
  });

  it('deposit clears carried sap into pending', () => {
    rm.addSap('player', 8, 10);
    rm.depositSap('player');
    expect(rm.getSapCarried('player')).toBe(0);
    expect(rm.getPendingSap()).toBe(8);
  });

  it('convertSap turns pending into honey', () => {
    rm.addSap('player', 3, 10);
    rm.depositSap('player');
    rm.convertSap(3);
    expect(rm.getHoney()).toBe(3);
    expect(rm.getPendingSap()).toBe(0);
  });

  it('caps honey at storage limit', () => {
    rm.addSap('player', 10, 10);
    rm.depositSap('player');
    rm.convertSap(200);
    expect(rm.getHoney()).toBe(10);
  });

  it('stealSap returns amount stolen and reduces carried', () => {
    rm.addSap('player', 5, 10);
    const stolen = rm.stealSap('player', 3);
    expect(stolen).toBe(3);
    expect(rm.getSapCarried('player')).toBe(2);
  });

  it('stealSap only takes what is available', () => {
    rm.addSap('player', 2, 10);
    const stolen = rm.stealSap('player', 10);
    expect(stolen).toBe(2);
    expect(rm.getSapCarried('player')).toBe(0);
  });

  it('stealHoney reduces honey', () => {
    rm.addSap('player', 10, 10);
    rm.depositSap('player');
    rm.convertSap(10);
    const stolen = rm.stealHoney(4);
    expect(stolen).toBe(4);
    expect(rm.getHoney()).toBe(6);
  });

  it('spendHoney succeeds if enough available', () => {
    rm.addSap('player', 10, 10);
    rm.depositSap('player');
    rm.convertSap(10);
    expect(rm.spendHoney(5)).toBe(true);
    expect(rm.getHoney()).toBe(5);
  });

  it('spendHoney fails if insufficient', () => {
    expect(rm.spendHoney(5)).toBe(false);
    expect(rm.getHoney()).toBe(0);
  });
});
```

- [ ] **Step 2: Run — confirm all fail**

Run: `npm test`
Expected: 11 tests FAIL — `Cannot find module '../src/systems/ResourceManager.js'`

- [ ] **Step 3: Implement ResourceManager**

```js
// src/systems/ResourceManager.js
export default class ResourceManager {
  constructor({ honeyStorage, sapConversionRate }) {
    this._honeyStorage = honeyStorage;
    this._sapConversionRate = sapConversionRate;
    this._honey = 0;
    this._pendingSap = 0;
    this._carried = {};
  }

  getSapCarried(id) { return this._carried[id] ?? 0; }
  getHoney() { return this._honey; }
  getPendingSap() { return this._pendingSap; }

  addSap(id, amount, capacity) {
    const current = this.getSapCarried(id);
    this._carried[id] = Math.min(current + amount, capacity);
  }

  depositSap(id) {
    this._pendingSap += this._carried[id] ?? 0;
    this._carried[id] = 0;
  }

  convertSap(units) {
    const converting = Math.min(this._pendingSap, units);
    this._honey = Math.min(this._honey + converting * this._sapConversionRate, this._honeyStorage);
    this._pendingSap -= converting;
  }

  stealSap(id, amount) {
    const available = this.getSapCarried(id);
    const stolen = Math.min(available, amount);
    this._carried[id] = available - stolen;
    return stolen;
  }

  stealHoney(amount) {
    const stolen = Math.min(this._honey, amount);
    this._honey -= stolen;
    return stolen;
  }

  spendHoney(amount) {
    if (this._honey < amount) return false;
    this._honey -= amount;
    return true;
  }
}
```

- [ ] **Step 4: Run — confirm all pass**

Run: `npm test`
Expected: 11 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/systems/ResourceManager.js tests/ResourceManager.test.js
git commit -m "feat: ResourceManager — sap carry, honey, steal, spend"
```

---

### Task 4: WaveManager (with tests)

**Files:**
- Create: `src/systems/WaveManager.js`
- Create: `tests/WaveManager.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/WaveManager.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import WaveManager from '../src/systems/WaveManager.js';

const config = {
  firstWaveDelay: 15000,
  waveInterval: 30000,
  baseCount: 3,
  countIncrement: 2,
};

describe('WaveManager', () => {
  let wm;
  beforeEach(() => { wm = new WaveManager(config); });

  it('returns null before first wave delay', () => {
    expect(wm.update(14999)).toBeNull();
  });

  it('spawns wave 1 at firstWaveDelay', () => {
    const wave = wm.update(15000);
    expect(wave).not.toBeNull();
    expect(wave.number).toBe(1);
    expect(wave.hunterCount).toBe(3);
    expect(wave.raiderCount).toBe(0);
  });

  it('does not spawn again until waveInterval passes', () => {
    wm.update(15000);
    expect(wm.update(30000)).toBeNull();
  });

  it('spawns wave 2 after waveInterval', () => {
    wm.update(15000);
    const wave = wm.update(45001);
    expect(wave).not.toBeNull();
    expect(wave.number).toBe(2);
    expect(wave.hunterCount).toBe(5);
  });

  it('introduces raiders from wave 3', () => {
    wm.update(15000);
    wm.update(45001);
    const wave = wm.update(75002);
    expect(wave.raiderCount).toBeGreaterThan(0);
  });

  it('getWaveNumber tracks current wave', () => {
    wm.update(15000);
    wm.update(45001);
    expect(wm.getWaveNumber()).toBe(2);
  });
});
```

- [ ] **Step 2: Run — confirm all fail**

Run: `npm test`
Expected: 6 tests FAIL

- [ ] **Step 3: Implement WaveManager**

```js
// src/systems/WaveManager.js
export default class WaveManager {
  constructor({ firstWaveDelay, waveInterval, baseCount, countIncrement }) {
    this._waveInterval = waveInterval;
    this._baseCount = baseCount;
    this._countIncrement = countIncrement;
    this._waveNumber = 0;
    this._nextWaveAt = firstWaveDelay;
  }

  // Pass total elapsed ms from Phaser's `time` argument. Returns wave spec or null.
  update(elapsed) {
    if (elapsed < this._nextWaveAt) return null;

    this._waveNumber++;
    this._nextWaveAt = elapsed + this._waveInterval;

    const n = this._waveNumber;
    const total = this._baseCount + (n - 1) * this._countIncrement;
    const raiderCount = n >= 3 ? Math.floor(total * 0.4) : 0;

    return { number: n, hunterCount: total - raiderCount, raiderCount };
  }

  getWaveNumber() { return this._waveNumber; }
}
```

- [ ] **Step 4: Run — confirm all pass**

Run: `npm test`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/systems/WaveManager.js tests/WaveManager.test.js
git commit -m "feat: WaveManager — escalating hunter/raider waves"
```

---

### Task 5: PollinationSystem (with tests)

**Files:**
- Create: `src/systems/PollinationSystem.js`
- Create: `tests/PollinationSystem.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/PollinationSystem.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import PollinationSystem from '../src/systems/PollinationSystem.js';

describe('PollinationSystem', () => {
  let ps, spawnCb;

  beforeEach(() => {
    spawnCb = vi.fn();
    ps = new PollinationSystem({ spawnDelay: 6000, radius: 150, onSpawn: spawnCb });
  });

  it('does not spawn before spawnDelay', () => {
    ps.pollinate({ x: 100, y: 100 }, 0);
    ps.update(5999);
    expect(spawnCb).not.toHaveBeenCalled();
  });

  it('fires onSpawn after spawnDelay', () => {
    ps.pollinate({ x: 100, y: 100 }, 0);
    ps.update(6000);
    expect(spawnCb).toHaveBeenCalledOnce();
  });

  it('spawn position is within radius of source', () => {
    ps.pollinate({ x: 500, y: 500 }, 0);
    ps.update(6000);
    const { x, y } = spawnCb.mock.calls[0][0];
    expect(Math.hypot(x - 500, y - 500)).toBeLessThanOrEqual(150);
  });

  it('handles multiple pollinations independently', () => {
    ps.pollinate({ x: 100, y: 100 }, 0);
    ps.pollinate({ x: 200, y: 200 }, 1000);
    ps.update(6000);
    expect(spawnCb).toHaveBeenCalledOnce();
    ps.update(7001);
    expect(spawnCb).toHaveBeenCalledTimes(2);
  });

  it('does not fire twice for the same pollination', () => {
    ps.pollinate({ x: 100, y: 100 }, 0);
    ps.update(6000);
    ps.update(12000);
    expect(spawnCb).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run — confirm all fail**

Run: `npm test`
Expected: 5 tests FAIL

- [ ] **Step 3: Implement PollinationSystem**

```js
// src/systems/PollinationSystem.js
export default class PollinationSystem {
  constructor({ spawnDelay, radius, onSpawn }) {
    this._spawnDelay = spawnDelay;
    this._radius = radius;
    this._onSpawn = onSpawn;
    this._pending = []; // { x, y, fireAt }
  }

  pollinate(source, now) {
    this._pending.push({ x: source.x, y: source.y, fireAt: now + this._spawnDelay });
  }

  update(now) {
    const ready = this._pending.filter(p => now >= p.fireAt);
    this._pending = this._pending.filter(p => now < p.fireAt);
    for (const p of ready) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * this._radius;
      this._onSpawn({ x: p.x + Math.cos(angle) * dist, y: p.y + Math.sin(angle) * dist });
    }
  }
}
```

- [ ] **Step 4: Run — confirm all pass**

Run: `npm test`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/systems/PollinationSystem.js tests/PollinationSystem.test.js
git commit -m "feat: PollinationSystem — delayed flower spawns within radius"
```

---

### Task 6: Scene Shells + main.js

**Files:**
- Create: `src/main.js`
- Create: `src/scenes/BootScene.js`
- Create: `src/scenes/MenuScene.js`
- Create: `src/scenes/PlacementScene.js`
- Create: `src/scenes/GameScene.js`
- Create: `src/scenes/PauseScene.js`
- Create: `src/scenes/GameOverScene.js`
- Create: `src/scenes/MetaUpgradeScene.js`

- [ ] **Step 1: Create src/main.js**

```js
import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import PlacementScene from './scenes/PlacementScene.js';
import GameScene from './scenes/GameScene.js';
import PauseScene from './scenes/PauseScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import MetaUpgradeScene from './scenes/MetaUpgradeScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game',
  backgroundColor: '#2d5a1b',
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [BootScene, MenuScene, PlacementScene, GameScene, PauseScene, GameOverScene, MetaUpgradeScene],
});
```

- [ ] **Step 2: Create src/scenes/BootScene.js**

Generates all placeholder textures with Phaser Graphics before the game renders any sprites.

```js
import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // player-bee: yellow circle
    g.fillStyle(0xffd700);
    g.fillCircle(16, 16, 14);
    g.generateTexture('player-bee', 32, 32);

    // hunter-wasp: orange with black stripes
    g.clear();
    g.fillStyle(0xff6600);
    g.fillRect(0, 0, 28, 28);
    g.fillStyle(0x000000);
    g.fillRect(0, 8, 28, 4);
    g.fillRect(0, 18, 28, 4);
    g.generateTexture('hunter-wasp', 28, 28);

    // raider-wasp: dark orange with black stripes
    g.clear();
    g.fillStyle(0xcc4400);
    g.fillRect(0, 0, 28, 28);
    g.fillStyle(0x000000);
    g.fillRect(0, 8, 28, 4);
    g.fillRect(0, 18, 28, 4);
    g.generateTexture('raider-wasp', 28, 28);

    // flower: green circle with pink center
    g.clear();
    g.fillStyle(0x00aa00);
    g.fillCircle(20, 20, 18);
    g.fillStyle(0xff99cc);
    g.fillCircle(20, 20, 8);
    g.generateTexture('flower', 40, 40);

    // hive: amber square with inner square
    g.clear();
    g.fillStyle(0xcc8800);
    g.fillRect(0, 0, 64, 64);
    g.fillStyle(0xffaa00);
    g.fillRect(8, 8, 48, 48);
    g.generateTexture('hive', 64, 64);

    // stinger: small white rectangle
    g.clear();
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 8, 3);
    g.generateTexture('stinger', 8, 3);

    g.destroy();
    this.scene.start('MenuScene');
  }
}
```

- [ ] **Step 3: Create src/scenes/MenuScene.js**

```js
import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const cx = 640, cy = 360;

    this.add.text(cx, cy - 100, 'BEE GAME', {
      fontSize: '72px', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 20, 'Protect the hive. Survive 10 minutes.', {
      fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5);

    const btn = this.add.text(cx, cy + 60, '[ START ]', {
      fontSize: '36px', color: '#ffd700',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout', () => btn.setColor('#ffd700'));
    btn.on('pointerdown', () => this.scene.start('PlacementScene'));
  }
}
```

- [ ] **Step 4: Create src/scenes/PlacementScene.js**

```js
import Phaser from 'phaser';
import { WORLD } from '../constants.js';

export default class PlacementScene extends Phaser.Scene {
  constructor() { super('PlacementScene'); }

  create() {
    this.add.rectangle(WORLD.WIDTH / 2, WORLD.HEIGHT / 2, WORLD.WIDTH, WORLD.HEIGHT, 0x2d5a1b);
    this.cameras.main.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);

    this.add.text(640, 40, 'Click to place your hive', {
      fontSize: '28px', color: '#ffd700',
    }).setOrigin(0.5).setScrollFactor(0);

    const preview = this.add.image(0, 0, 'hive').setAlpha(0.5);

    this.input.on('pointermove', ptr => {
      preview.setPosition(ptr.worldX, ptr.worldY);
    });

    this.input.on('pointerdown', ptr => {
      this.scene.start('GameScene', { hiveX: ptr.worldX, hiveY: ptr.worldY });
    });
  }
}
```

- [ ] **Step 5: Create src/scenes/GameScene.js (stub)**

```js
import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.hiveX = data.hiveX ?? 1280;
    this.hiveY = data.hiveY ?? 720;
    this._ended = false;
  }

  create() {}
  update(time, delta) {}
}
```

- [ ] **Step 6: Create src/scenes/PauseScene.js**

```js
import Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }
  create() {}
}
```

- [ ] **Step 7: Create src/scenes/GameOverScene.js**

```js
import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.won = data.won ?? false;
    this.score = data.score ?? 0;
  }

  create() {
    const cx = 640, cy = 360;

    this.add.text(cx, cy - 80, this.won ? 'YOU WIN!' : 'HIVE DESTROYED', {
      fontSize: '56px',
      color: this.won ? '#ffd700' : '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy, `Score: ${this.score}`, {
      fontSize: '32px', color: '#ffffff',
    }).setOrigin(0.5);

    const btn = this.add.text(cx, cy + 80, '[ PLAY AGAIN ]', {
      fontSize: '28px', color: '#ffd700',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
```

- [ ] **Step 8: Create src/scenes/MetaUpgradeScene.js (stub)**

```js
import Phaser from 'phaser';

export default class MetaUpgradeScene extends Phaser.Scene {
  constructor() { super('MetaUpgradeScene'); }
  create() {
    this.add.text(640, 360, 'Meta Upgrades (Plan 4)', {
      fontSize: '32px', color: '#ffffff',
    }).setOrigin(0.5);
  }
}
```

- [ ] **Step 9: Run dev server, verify menu loads**

Run: `npm run dev`
Open browser to `http://localhost:5173`
Expected: Yellow "BEE GAME" title and "[ START ]" button on dark background. Clicking start shows the placement map.

- [ ] **Step 10: Commit**

```bash
git add src/
git commit -m "feat: scene shells, placeholder texture generation, menu flow"
```

---

### Task 7: World + Camera in GameScene

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Replace stub create() with world setup**

```js
// src/scenes/GameScene.js
import Phaser from 'phaser';
import { WORLD, BEE, HIVE, WASP, WAVE, FLOWER, TIMER } from '../constants.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.hiveX = data.hiveX ?? 1280;
    this.hiveY = data.hiveY ?? 720;
    this._ended = false;
  }

  create() {
    // World background
    this.add.rectangle(WORLD.WIDTH / 2, WORLD.HEIGHT / 2, WORLD.WIDTH, WORLD.HEIGHT, 0x2d5a1b);

    // Camera and physics bounds
    this.cameras.main.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);

    // Physics groups
    this.flowers = this.physics.add.staticGroup();
    this.wasps = this.physics.add.group();
    this.stingers = this.physics.add.group();
  }

  update(time, delta) {}
}
```

- [ ] **Step 2: Run dev server — place hive, verify green world loads**

Expected: After placement click, green 2560×1440 world loads, no crash.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: GameScene world background, camera bounds, physics groups"
```

---

### Task 8: Flower Entity

**Files:**
- Create: `src/entities/Flower.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Create src/entities/Flower.js**

```js
import Phaser from 'phaser';
import { FLOWER } from '../constants.js';

export default class Flower extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'flower');
    scene.add.existing(this);
    // Static body assigned by staticGroup.add() in GameScene — do NOT call physics.add.existing here
    this.sapRemaining = FLOWER.SAP_AMOUNT;
    this.pollenCollected = false;
  }

  // Returns true if pollen was available (first call only)
  collectPollen() {
    if (this.pollenCollected) return false;
    this.pollenCollected = true;
    this.setTint(0x888888);
    return true;
  }

  // Returns amount of sap actually taken
  collectSap(amount) {
    const taken = Math.min(this.sapRemaining, amount);
    this.sapRemaining -= taken;
    if (this.sapRemaining <= 0) this.setAlpha(0.4);
    return taken;
  }
}
```

- [ ] **Step 2: Spawn initial flowers in GameScene.create()**

Add import and method to `GameScene.js`. Add to `create()` after physics groups:

```js
import Flower from '../entities/Flower.js';

// In create():
this._spawnInitialFlowers();
```

Add method to the class:

```js
_spawnInitialFlowers() {
  for (let i = 0; i < FLOWER.INITIAL_COUNT; i++) {
    const x = Phaser.Math.Between(100, WORLD.WIDTH - 100);
    const y = Phaser.Math.Between(100, WORLD.HEIGHT - 100);
    const f = new Flower(this, x, y);
    this.flowers.add(f);       // staticGroup.add() creates the static body
    this.flowers.refresh();    // refresh static group bounds after adding
  }
}
```

- [ ] **Step 3: Run dev server — verify ~20 flower sprites on map**

Expected: Green circles with pink centers scattered across the world.

- [ ] **Step 4: Commit**

```bash
git add src/entities/Flower.js src/scenes/GameScene.js
git commit -m "feat: Flower entity, initial flower scatter"
```

---

### Task 9: Hive Entity

**Files:**
- Create: `src/entities/Hive.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Create src/entities/Hive.js**

```js
import Phaser from 'phaser';
import { HIVE } from '../constants.js';

export default class Hive extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'hive');
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body
    this.hp = HIVE.HP;
    this.maxHp = HIVE.HP;
  }

  // Returns true if hive destroyed
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.setTint(0xff4444);
    this.scene.time.delayedCall(150, () => { if (this.active) this.clearTint(); });
    return this.hp <= 0;
  }
}
```

- [ ] **Step 2: Add Hive to GameScene.create()**

Add import and hive creation. In `create()`, after physics groups:

```js
import Hive from '../entities/Hive.js';

// In create():
this.hive = new Hive(this, this.hiveX, this.hiveY);
```

- [ ] **Step 3: Run dev server — verify amber hive appears at click position**

Expected: Amber square sprite at the position you clicked during placement.

- [ ] **Step 4: Commit**

```bash
git add src/entities/Hive.js src/scenes/GameScene.js
git commit -m "feat: Hive entity at player-selected position"
```

---

### Task 10: ResourceManager + PollinationSystem wired to GameScene

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Instantiate systems in GameScene.create()**

Add imports and system setup. In `create()`, after hive:

```js
import ResourceManager from '../systems/ResourceManager.js';
import PollinationSystem from '../systems/PollinationSystem.js';

// In create():
this.resources = new ResourceManager({
  honeyStorage: HIVE.HONEY_STORAGE,
  sapConversionRate: HIVE.SAP_CONVERSION_RATE,
});

this.pollination = new PollinationSystem({
  spawnDelay: FLOWER.SPAWN_DELAY,
  radius: FLOWER.POLLINATION_RADIUS,
  onSpawn: ({ x, y }) => {
    // Clamp to world bounds
    const fx = Phaser.Math.Clamp(x, 40, WORLD.WIDTH - 40);
    const fy = Phaser.Math.Clamp(y, 40, WORLD.HEIGHT - 40);
    const f = new Flower(this, fx, fy);
    this.flowers.add(f);
    this.flowers.refresh();
  },
});

// Tick: convert 1 pending sap unit → honey every SAP_CONVERSION_INTERVAL ms
this.time.addEvent({
  delay: HIVE.SAP_CONVERSION_INTERVAL,
  callback: () => this.resources.convertSap(1),
  loop: true,
});
```

- [ ] **Step 2: Tick pollination in GameScene.update()**

```js
update(time, delta) {
  this.pollination.update(time);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: wire ResourceManager and PollinationSystem into GameScene"
```

---

### Task 11: Stinger Projectile

**Files:**
- Create: `src/entities/Stinger.js`

- [ ] **Step 1: Create src/entities/Stinger.js**

```js
import Phaser from 'phaser';
import { BEE } from '../constants.js';

export default class Stinger extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, targetX, targetY) {
    super(scene, x, y, 'stinger');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const angleDeg = Phaser.Math.Angle.Between(x, y, targetX, targetY) * (180 / Math.PI);
    this.setRotation(Phaser.Math.DegToRad(angleDeg));
    scene.physics.velocityFromAngle(angleDeg, BEE.STINGER_SPEED, this.body.velocity);

    this.damage = BEE.STINGER_DAMAGE;

    // Auto-destroy after 1.5s if no collision
    scene.time.delayedCall(1500, () => { if (this.active) this.destroy(); });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/entities/Stinger.js
git commit -m "feat: Stinger projectile — velocity toward target, auto-expire"
```

---

### Task 12: PlayerBee Entity

**Files:**
- Create: `src/entities/PlayerBee.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Create src/entities/PlayerBee.js**

```js
import Phaser from 'phaser';
import { BEE } from '../constants.js';

export default class PlayerBee extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, onFire) {
    super(scene, x, y, 'player-bee');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.hp = BEE.HP;
    this.maxHp = BEE.HP;
    this.alive = true;
    this._onFire = onFire ?? null;
    this._lastFired = 0;
    this._cursors = scene.input.keyboard.createCursorKeys();
    this._wasd = scene.input.keyboard.addKeys('W,A,S,D');
  }

  update(time, delta) {
    if (!this.alive) return;
    this._move();
    this._autoFire(time);
  }

  _move() {
    const left  = this._cursors.left.isDown  || this._wasd.A.isDown;
    const right = this._cursors.right.isDown || this._wasd.D.isDown;
    const up    = this._cursors.up.isDown    || this._wasd.W.isDown;
    const down  = this._cursors.down.isDown  || this._wasd.S.isDown;

    let vx = (right ? 1 : 0) - (left ? 1 : 0);
    let vy = (down  ? 1 : 0) - (up   ? 1 : 0);

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    this.setVelocity(vx * BEE.SPEED, vy * BEE.SPEED);
  }

  _autoFire(time) {
    if (!this._onFire || time - this._lastFired < BEE.STINGER_RATE) return;
    const fired = this._onFire(this.x, this.y, BEE.STINGER_RANGE);
    if (fired) this._lastFired = time;
  }

  // Returns true if bee died
  takeDamage(amount) {
    if (!this.alive) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.setTint(0xff4444);
    this.scene.time.delayedCall(150, () => { if (this.active) this.clearTint(); });
    if (this.hp <= 0) {
      this.alive = false;
      this.setVisible(false).setActive(false);
      this.body.enable = false;
    }
    return this.hp <= 0;
  }

  respawn(x, y) {
    this.hp = this.maxHp;
    this.alive = true;
    this.setPosition(x, y).setVisible(true).setActive(true);
    this.body.enable = true;
    this.clearTint();
  }
}
```

- [ ] **Step 2: Add PlayerBee to GameScene.create()**

Add import and player creation. In `create()`, after pollination setup:

```js
import PlayerBee from '../entities/PlayerBee.js';
import Stinger from '../entities/Stinger.js';

// In create():
this.player = new PlayerBee(
  this,
  this.hiveX,
  this.hiveY + 80,
  (x, y, range) => {
    // Find nearest active wasp within range
    let nearest = null, nearestDist = range;
    this.wasps.getChildren().forEach(w => {
      if (!w.active) return;
      const d = Phaser.Math.Distance.Between(x, y, w.x, w.y);
      if (d < nearestDist) { nearest = w; nearestDist = d; }
    });
    if (!nearest) return false;
    const s = new Stinger(this, x, y, nearest.x, nearest.y);
    this.stingers.add(s);
    return true;
  },
);

this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
```

- [ ] **Step 3: Add player update to GameScene.update()**

```js
update(time, delta) {
  this.pollination.update(time);
  if (this.player.alive) this.player.update(time, delta);
}
```

- [ ] **Step 4: Run dev server — verify bee moves with WASD/arrows**

Expected: Yellow bee follows input, camera scrolls smoothly, stays within world bounds.

- [ ] **Step 5: Commit**

```bash
git add src/entities/PlayerBee.js src/scenes/GameScene.js
git commit -m "feat: PlayerBee — WASD movement, camera follow, auto-fire hook"
```

---

### Task 13: Sap & Pollen Pickup

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Add flower pickup overlap in GameScene.create()**

Add after player creation:

```js
// Pollen + sap pickup when player overlaps flower
this.physics.add.overlap(this.player, this.flowers, (player, flower) => {
  // Pollen: auto-use, triggers pollination
  if (flower.collectPollen()) {
    this.pollination.pollinate({ x: flower.x, y: flower.y }, this.time.now);
  }

  // Sap: add to carry (capped at SAP_CAPACITY)
  if (flower.sapRemaining > 0) {
    const space = BEE.SAP_CAPACITY - this.resources.getSapCarried('player');
    if (space > 0) {
      const taken = flower.collectSap(space);
      this.resources.addSap('player', taken, BEE.SAP_CAPACITY);
    }
  }
});
```

- [ ] **Step 2: Add hive deposit overlap in GameScene.create()**

```js
// Deposit sap when player overlaps hive
this.physics.add.overlap(this.player, this.hive, () => {
  if (this.resources.getSapCarried('player') > 0) {
    this.resources.depositSap('player');
  }
});
```

- [ ] **Step 3: Run dev server — move bee over flowers and back to hive**

Expected: No crash. (HUD not yet built — add `console.log(this.resources.getHoney())` in update() temporarily to verify honey increases after a few deposit+conversion cycles.)

- [ ] **Step 4: Remove any temporary console.log, commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: sap/pollen pickup on flower overlap, sap deposit at hive"
```

---

### Task 14: HunterWasp + RaiderWasp Entities

**Files:**
- Create: `src/entities/HunterWasp.js`
- Create: `src/entities/RaiderWasp.js`

- [ ] **Step 1: Create src/entities/HunterWasp.js**

```js
import Phaser from 'phaser';
import { WASP } from '../constants.js';

export default class HunterWasp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'hunter-wasp');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.hp = WASP.HP;
    this._target = null;
    this.lastHit = 0;
  }

  setTarget(target) { this._target = target; }

  update() {
    if (!this._target || !this._target.active || !this._target.alive) return;
    this.scene.physics.moveToObject(this, this._target, WASP.HUNTER_SPEED);
  }

  // Returns true if destroyed
  takeDamage(amount) {
    this.hp -= amount;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => { if (this.active) this.clearTint(); });
    if (this.hp <= 0) { this.destroy(); return true; }
    return false;
  }
}
```

- [ ] **Step 2: Create src/entities/RaiderWasp.js**

```js
import Phaser from 'phaser';
import { WASP } from '../constants.js';

export default class RaiderWasp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, hive) {
    super(scene, x, y, 'raider-wasp');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.hp = WASP.HP;
    this._hive = hive;
    this.lastHit = 0;
  }

  update() {
    if (!this._hive || !this._hive.active) return;
    this.scene.physics.moveToObject(this, this._hive, WASP.RAIDER_SPEED);
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => { if (this.active) this.clearTint(); });
    if (this.hp <= 0) { this.destroy(); return true; }
    return false;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/entities/HunterWasp.js src/entities/RaiderWasp.js
git commit -m "feat: HunterWasp and RaiderWasp entities"
```

---

### Task 15: Wave Spawning + Combat Collisions

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Add WaveManager and wasp spawning in GameScene.create()**

Add imports and setup after hive deposit overlap:

```js
import WaveManager from '../systems/WaveManager.js';
import HunterWasp from '../entities/HunterWasp.js';
import RaiderWasp from '../entities/RaiderWasp.js';

// In create():
this.waveManager = new WaveManager({
  firstWaveDelay: WAVE.FIRST_WAVE_DELAY,
  waveInterval: WAVE.WAVE_INTERVAL,
  baseCount: WAVE.BASE_COUNT,
  countIncrement: WAVE.COUNT_INCREMENT,
});

// Stinger hits wasp
this.physics.add.overlap(this.stingers, this.wasps, (stinger, wasp) => {
  stinger.destroy();
  wasp.takeDamage(BEE.STINGER_DAMAGE);
});
```

- [ ] **Step 2: Add wasp spawning helpers to GameScene class**

```js
_spawnWave(waveSpec) {
  for (let i = 0; i < waveSpec.hunterCount; i++) {
    const { x, y } = this._edgePoint();
    const w = new HunterWasp(this, x, y);
    w.setTarget(this.player);
    this.wasps.add(w);
  }
  for (let i = 0; i < waveSpec.raiderCount; i++) {
    const { x, y } = this._edgePoint();
    this.wasps.add(new RaiderWasp(this, x, y, this.hive));
  }
}

_edgePoint() {
  const edge = Phaser.Math.Between(0, 3);
  const w = WORLD.WIDTH, h = WORLD.HEIGHT;
  if (edge === 0) return { x: Phaser.Math.Between(0, w), y: 0 };
  if (edge === 1) return { x: Phaser.Math.Between(0, w), y: h };
  if (edge === 2) return { x: 0,                          y: Phaser.Math.Between(0, h) };
  return             { x: w,                              y: Phaser.Math.Between(0, h) };
}
```

- [ ] **Step 3: Tick wasps and wave manager in GameScene.update()**

```js
update(time, delta) {
  this.pollination.update(time);
  if (this.player.alive) this.player.update(time, delta);
  this.wasps.getChildren().forEach(w => w.update());
  const wave = this.waveManager.update(time);
  if (wave) this._spawnWave(wave);
}
```

- [ ] **Step 4: Run dev server — wait 15 seconds, verify wasps spawn and are shootable**

Expected: After ~15s, orange wasps appear from edges, move toward bee/hive. Player auto-fires white stingers at them. Stingers destroy wasps on contact.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: wave spawning, wasp movement, stinger collision"
```

---

### Task 16: Two-Layer Defense + Win/Lose

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Hunter wasp ↔ player bee (steal sap → drain HP)**

Add to `GameScene.create()` after stinger overlap:

```js
// Hunter hits player: steal sap first, then drain HP
this.physics.add.overlap(this.wasps, this.player, (wasp, player) => {
  if (!(wasp instanceof HunterWasp)) return;
  if (!player.alive) return;
  const now = this.time.now;
  if (now - wasp.lastHit < WASP.HIT_COOLDOWN) return;
  wasp.lastHit = now;

  const sap = this.resources.getSapCarried('player');
  if (sap > 0) {
    this.resources.stealSap('player', WASP.SAP_STEAL);
  } else {
    if (player.takeDamage(WASP.DAMAGE)) this._onPlayerDeath();
  }
});
```

- [ ] **Step 2: Raider wasp ↔ hive (steal honey → drain hive HP)**

```js
// Raider hits hive: steal honey first, then drain hive HP
this.physics.add.overlap(this.wasps, this.hive, (wasp, hive) => {
  if (!(wasp instanceof RaiderWasp)) return;
  const now = this.time.now;
  if (now - wasp.lastHit < WASP.HIT_COOLDOWN) return;
  wasp.lastHit = now;

  if (this.resources.getHoney() > 0) {
    this.resources.stealHoney(WASP.HONEY_STEAL);
  } else {
    if (hive.takeDamage(WASP.DAMAGE)) this._endGame(false);
  }
});
```

- [ ] **Step 3: Add _onPlayerDeath, _endGame, _calculateScore, win timer**

```js
_onPlayerDeath() {
  if (this.resources.spendHoney(BEE.RESPAWN_COST)) {
    this.time.delayedCall(2000, () => {
      if (!this._ended) this.player.respawn(this.hiveX, this.hiveY);
    });
  } else {
    this._endGame(false); // can't afford respawn
  }
}

_endGame(won) {
  if (this._ended) return;
  this._ended = true;
  this.scene.start('GameOverScene', { won, score: this._calculateScore() });
}

_calculateScore() {
  return Math.floor(
    this.resources.getHoney() * 10 +
    this.waveManager.getWaveNumber() * 100
  );
}
```

Add win timer to `create()`:

```js
// Win: survive full run duration
this.time.delayedCall(TIMER.RUN_DURATION, () => this._endGame(true));
```

- [ ] **Step 4: Run dev server — verify full loop**

- Start game, place hive
- Move into flowers — sap increases
- Return to hive — honey starts building
- After 15s — wasps attack
- Hunter hits you with no sap — bee HP goes down
- Raider reaches hive with no honey — hive HP goes down
- Hive HP 0 — "HIVE DESTROYED" screen
- Click Play Again — returns to menu

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: two-layer defense, player death/respawn, win/lose conditions"
```

---

### Task 17: HUD

**Files:**
- Create: `src/ui/HUD.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Create src/ui/HUD.js**

```js
import Phaser from 'phaser';
import { TIMER } from '../constants.js';

export default class HUD {
  constructor(scene, resources, hive, player) {
    this._resources = resources;
    this._hive = hive;
    this._player = player;

    const s = { fontSize: '18px', color: '#ffd700', stroke: '#000', strokeThickness: 3 };
    const sf = { scrollFactor: 0 };

    this._honeyText   = scene.add.text(16,  16, '', s).setScrollFactor(0).setDepth(100);
    this._sapText     = scene.add.text(16,  42, '', s).setScrollFactor(0).setDepth(100);
    this._beeHpText   = scene.add.text(16,  68, '', s).setScrollFactor(0).setDepth(100);
    this._hiveHpText  = scene.add.text(16,  94, '', s).setScrollFactor(0).setDepth(100);
    this._waveText    = scene.add.text(16, 120, '', s).setScrollFactor(0).setDepth(100);
    this._timerText   = scene.add.text(640, 16, '', { ...s, fontSize: '24px' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
  }

  update(elapsed, waveNumber) {
    const remaining = Math.max(0, TIMER.RUN_DURATION - elapsed);
    const mins = Math.floor(remaining / 60000);
    const secs = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');

    this._honeyText.setText(`Honey: ${Math.floor(this._resources.getHoney())}`);
    this._sapText.setText(`Sap: ${this._resources.getSapCarried('player')}`);
    this._beeHpText.setText(`Bee HP: ${this._player.hp} / ${this._player.maxHp}`);
    this._hiveHpText.setText(`Hive HP: ${this._hive.hp} / ${this._hive.maxHp}`);
    this._waveText.setText(`Wave: ${waveNumber}`);
    this._timerText.setText(`${mins}:${secs}`);
  }
}
```

- [ ] **Step 2: Wire HUD in GameScene**

Add import and initialization in `GameScene.create()` at the very end (after all entities/overlaps are set up):

```js
import HUD from '../ui/HUD.js';

// At end of create():
this.hud = new HUD(this, this.resources, this.hive, this.player);
```

Add HUD update at top of `GameScene.update()`:

```js
update(time, delta) {
  if (this.hud) this.hud.update(time, this.waveManager.getWaveNumber());
  this.pollination.update(time);
  if (this.player.alive) this.player.update(time, delta);
  this.wasps.getChildren().forEach(w => w.update());
  const wave = this.waveManager.update(time);
  if (wave) this._spawnWave(wave);
}
```

- [ ] **Step 3: Run dev server — verify full playable loop with HUD**

Expected:
- Top-left: Honey, Sap carried, Bee HP, Hive HP, Wave number — all updating in real time
- Top-center: countdown timer from 10:00
- All values respond correctly to gameplay (collecting sap, wasp attacks, wave escalation)
- Win screen appears at timer 0:00
- Loss screen appears when hive HP reaches 0

- [ ] **Step 4: Commit**

```bash
git add src/ui/HUD.js src/scenes/GameScene.js
git commit -m "feat: HUD — honey, sap, HP bars, countdown timer, wave counter"
```

---

## Plan 1 Complete

The core loop is now playable. Next plans:

- **Plan 2:** Worker bees, defense towers (Stinger Turret, Resin Trap, Guard Bee Post), pause/build menu, upgrade menu
- **Plan 3:** Spider webs (momentum reset), wind force system, butterflies (passive pollination)
- **Plan 4:** Scoring system, meta-progression (localStorage), MetaUpgradeScene
