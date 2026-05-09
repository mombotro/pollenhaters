# Meta-Progression & LocalStorage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent Royal Jelly currency, a between-run upgrade screen, and LocalStorage save/load so progress carries across sessions.

**Architecture:** A single pure-JS `MetaSave` static class owns all localStorage access. `GameOverScene` awards jelly and records run stats. `MetaUpgradeScene` replaces its stub with a full purchase UI. `GameScene.create()` reads the save and applies upgrades to entities after initialization. No existing system is restructured.

**Tech Stack:** Phaser 3.87, Vite 5, Vitest 2, vanilla JS

---

### Task 1: MetaSave — pure-JS persistence class with tests

**Files:**
- Create: `src/systems/MetaSave.js`
- Create: `tests/MetaSave.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/MetaSave.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MetaSave from '../src/systems/MetaSave.js';

// Minimal localStorage mock — no jsdom needed
const store = {};
const localStorageMock = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; },
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

describe('MetaSave', () => {
  beforeEach(() => { delete store['bee-game-save']; });

  it('load() returns defaults when key missing', () => {
    const s = MetaSave.load();
    expect(s.jellyBalance).toBe(0);
    expect(s.highScore).toBe(0);
    expect(s.lastRun).toBeNull();
    expect(s.upgrades.BEE_SPEED_META).toBe(0);
    expect(s.upgrades.START_WORKER).toBe(0);
  });

  it('load() returns defaults when JSON is corrupt', () => {
    store['bee-game-save'] = '{bad json{{';
    const s = MetaSave.load();
    expect(s.jellyBalance).toBe(0);
  });

  it('addJelly persists balance', () => {
    MetaSave.addJelly(100);
    expect(MetaSave.load().jellyBalance).toBe(100);
    MetaSave.addJelly(50);
    expect(MetaSave.load().jellyBalance).toBe(150);
  });

  it('purchaseUpgrade deducts jelly and increments level', () => {
    MetaSave.addJelly(200);
    const ok = MetaSave.purchaseUpgrade('BEE_SPEED_META', 50);
    expect(ok).toBe(true);
    expect(MetaSave.load().jellyBalance).toBe(150);
    expect(MetaSave.load().upgrades.BEE_SPEED_META).toBe(1);
  });

  it('purchaseUpgrade returns false and makes no change when balance insufficient', () => {
    MetaSave.addJelly(30);
    const ok = MetaSave.purchaseUpgrade('BEE_SPEED_META', 50);
    expect(ok).toBe(false);
    expect(MetaSave.load().jellyBalance).toBe(30);
    expect(MetaSave.load().upgrades.BEE_SPEED_META).toBe(0);
  });

  it('getUpgradeLevel returns 0 for unpurchased', () => {
    expect(MetaSave.getUpgradeLevel('START_ARMOR')).toBe(0);
  });

  it('reset() restores defaults', () => {
    MetaSave.addJelly(500);
    MetaSave.purchaseUpgrade('BEE_SPEED_META', 50);
    MetaSave.reset();
    const s = MetaSave.load();
    expect(s.jellyBalance).toBe(0);
    expect(s.upgrades.BEE_SPEED_META).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/MetaSave.test.js
```

Expected: FAIL — "Cannot find module '../src/systems/MetaSave.js'"

- [ ] **Step 3: Implement MetaSave**

Create `src/systems/MetaSave.js`:

```js
const KEY = 'bee-game-save';

function DEFAULTS() {
  return {
    jellyBalance: 0,
    upgrades: {
      BEE_SPEED_META:    0,
      BEE_HP_META:       0,
      HIVE_HP_META:      0,
      HIVE_STORAGE_META: 0,
      START_WORKER:      0,
      START_ARMOR:       0,
      START_HONEY:       0,
      START_GUARD:       0,
    },
    highScore: 0,
    lastRun: null,
  };
}

export default class MetaSave {
  static load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return DEFAULTS();
      const parsed = JSON.parse(raw);
      const d = DEFAULTS();
      return {
        jellyBalance:  parsed.jellyBalance  ?? d.jellyBalance,
        highScore:     parsed.highScore     ?? d.highScore,
        lastRun:       parsed.lastRun       ?? d.lastRun,
        upgrades: { ...d.upgrades, ...(parsed.upgrades ?? {}) },
      };
    } catch {
      return DEFAULTS();
    }
  }

  static save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  static addJelly(amount) {
    const s = MetaSave.load();
    s.jellyBalance += amount;
    MetaSave.save(s);
  }

  static purchaseUpgrade(key, cost) {
    const s = MetaSave.load();
    if (s.jellyBalance < cost) return false;
    s.jellyBalance -= cost;
    s.upgrades[key] = (s.upgrades[key] ?? 0) + 1;
    MetaSave.save(s);
    return true;
  }

  static getUpgradeLevel(key) {
    return MetaSave.load().upgrades[key] ?? 0;
  }

  static reset() {
    MetaSave.save(DEFAULTS());
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/MetaSave.test.js
```

Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```
git add src/systems/MetaSave.js tests/MetaSave.test.js
git commit -m "feat: add MetaSave — localStorage persistence for meta-progression"
```

---

### Task 2: GameOverScene — award jelly, show run stats

**Files:**
- Modify: `src/scenes/GameScene.js:527-538` (pass waves + timeSurvived to GameOverScene)
- Modify: `src/scenes/GameOverScene.js` (save jelly, display stats)

- [ ] **Step 1: Update `_endGame` and `_calculateScore` in GameScene**

In `src/scenes/GameScene.js`, replace `_endGame` and `_calculateScore` (lines 527–538):

```js
_endGame(won) {
  if (this._ended) return;
  this._ended = true;
  const score = this._calculateScore();
  const waves = this.waveManager.getWaveNumber();
  const timeSurvived = Math.floor(this._playTime / 1000);
  this.scene.start('GameOverScene', { won, score, waves, timeSurvived });
}

_calculateScore() {
  return Math.floor(
    this.resources.getHoney() * 10 +
    this.waveManager.getWaveNumber() * 100
  );
}
```

- [ ] **Step 2: Rewrite GameOverScene**

Replace the entire contents of `src/scenes/GameOverScene.js`:

```js
import Phaser from 'phaser';
import MetaSave from '../systems/MetaSave.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.won          = data.won          ?? false;
    this.score        = data.score        ?? 0;
    this.waves        = data.waves        ?? 0;
    this.timeSurvived = data.timeSurvived ?? 0;

    const earned = Math.floor(this.score / 10);
    MetaSave.addJelly(earned);
    this.earned = earned;

    const s = MetaSave.load();
    if (this.score > s.highScore) {
      s.highScore = this.score;
    }
    s.lastRun = { score: this.score, waves: this.waves, timeSurvived: this.timeSurvived, won: this.won };
    MetaSave.save(s);
    this.highScore = MetaSave.load().highScore;
  }

  create() {
    const cx = 640, cy = 360;
    const s28 = { fontSize: '28px', color: '#ffffff' };
    const sGold = { fontSize: '32px', color: '#ffd700' };

    this.add.text(cx, 120, this.won ? 'YOU WIN!' : 'HIVE DESTROYED', {
      fontSize: '56px',
      color: this.won ? '#ffd700' : '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 210, `Score: ${this.score}`, sGold).setOrigin(0.5);
    this.add.text(cx, 260, `Waves survived: ${this.waves}`, s28).setOrigin(0.5);

    const mins = Math.floor(this.timeSurvived / 60);
    const secs = String(this.timeSurvived % 60).padStart(2, '0');
    this.add.text(cx, 300, `Time: ${mins}:${secs}`, s28).setOrigin(0.5);

    this.add.text(cx, 360, `+${this.earned} Royal Jelly`, {
      fontSize: '36px', color: '#ffcc00', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 420, `All-time high score: ${this.highScore}`, {
      fontSize: '24px', color: '#aaaaaa',
    }).setOrigin(0.5);

    const btn = this.add.text(cx, 500, '[ BACK TO MENU ]', {
      fontSize: '28px', color: '#ffd700',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout',  () => btn.setColor('#ffd700'));
    btn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
```

- [ ] **Step 3: Run the full test suite**

```
npx vitest run
```

Expected: all tests PASS (GameScene has no unit tests; the scene changes are verified in-browser)

- [ ] **Step 4: Commit**

```
git add src/scenes/GameScene.js src/scenes/GameOverScene.js
git commit -m "feat: GameOverScene awards royal jelly and shows run stats"
```

---

### Task 3: MenuScene — add Upgrades button

**Files:**
- Modify: `src/scenes/MenuScene.js`

- [ ] **Step 1: Add Upgrades button to MenuScene**

Replace the entire contents of `src/scenes/MenuScene.js`:

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

    const btnStart = this.add.text(cx, cy + 60, '[ START ]', {
      fontSize: '36px', color: '#ffd700',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnStart.on('pointerover', () => btnStart.setColor('#ffffff'));
    btnStart.on('pointerout',  () => btnStart.setColor('#ffd700'));
    btnStart.on('pointerdown', () => this.scene.start('PlacementScene'));

    const btnUpgrades = this.add.text(cx, cy + 120, '[ UPGRADES ]', {
      fontSize: '28px', color: '#ffd700',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnUpgrades.on('pointerover', () => btnUpgrades.setColor('#ffffff'));
    btnUpgrades.on('pointerout',  () => btnUpgrades.setColor('#ffd700'));
    btnUpgrades.on('pointerdown', () => this.scene.start('MetaUpgradeScene'));
  }
}
```

- [ ] **Step 2: Run full test suite**

```
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 3: Commit**

```
git add src/scenes/MenuScene.js
git commit -m "feat: add Upgrades button to MenuScene"
```

---

### Task 4: MetaUpgradeScene — full upgrade purchase UI

**Files:**
- Modify: `src/scenes/MetaUpgradeScene.js`

- [ ] **Step 1: Implement MetaUpgradeScene**

Replace the entire contents of `src/scenes/MetaUpgradeScene.js`:

```js
import Phaser from 'phaser';
import MetaSave from '../systems/MetaSave.js';

const UPGRADES = [
  { key: 'BEE_SPEED_META',    label: 'Bee Speed',      cost: 50,  max: 3, desc: '+20 speed per level' },
  { key: 'BEE_HP_META',       label: 'Bee Health',     cost: 75,  max: 3, desc: '+2 max HP per level' },
  { key: 'HIVE_HP_META',      label: 'Hive Health',    cost: 75,  max: 3, desc: '+5 hive max HP per level' },
  { key: 'HIVE_STORAGE_META', label: 'Honey Storage',  cost: 100, max: 3, desc: '+50 storage per level' },
  { key: 'START_WORKER',      label: 'Start: Worker',  cost: 100, max: 1, desc: 'Begin each run with 1 worker bee' },
  { key: 'START_ARMOR',       label: 'Start: Armor',   cost: 150, max: 1, desc: 'Begin with 1 armor' },
  { key: 'START_HONEY',       label: 'Start: Honey',   cost: 80,  max: 1, desc: 'Begin with 30 honey' },
  { key: 'START_GUARD',       label: 'Start: Guard',   cost: 200, max: 1, desc: 'Begin with 1 guard post' },
];

export default class MetaUpgradeScene extends Phaser.Scene {
  constructor() { super('MetaUpgradeScene'); }

  create() {
    const cx = 640;

    this.add.text(cx, 50, 'UPGRADES', {
      fontSize: '48px', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5);

    this._jellyText = this.add.text(cx, 110, '', {
      fontSize: '28px', color: '#ffcc00',
    }).setOrigin(0.5);

    this._rows = [];
    UPGRADES.forEach((def, i) => {
      const y = 165 + i * 62;

      const nameText = this.add.text(200, y, def.label, {
        fontSize: '22px', color: '#ffffff',
      }).setOrigin(0, 0.5);

      const descText = this.add.text(200, y + 18, def.desc, {
        fontSize: '14px', color: '#aaaaaa',
      }).setOrigin(0, 0.5);

      const levelText = this.add.text(700, y, '', {
        fontSize: '22px', color: '#ffffff',
      }).setOrigin(0.5, 0.5);

      const btn = this.add.text(900, y, '', {
        fontSize: '22px', color: '#ffd700',
      }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => { if (btn._enabled) btn.setColor('#ffffff'); });
      btn.on('pointerout',  () => { if (btn._enabled) btn.setColor('#ffd700'); });
      btn.on('pointerdown', () => {
        if (!btn._enabled) return;
        MetaSave.purchaseUpgrade(def.key, def.cost);
        this._refresh();
      });

      this._rows.push({ def, nameText, descText, levelText, btn });
    });

    const backBtn = this.add.text(cx, 680, '[ BACK TO MENU ]', {
      fontSize: '28px', color: '#ffd700',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerout',  () => backBtn.setColor('#ffd700'));
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    this._refresh();
  }

  _refresh() {
    const s = MetaSave.load();
    this._jellyText.setText(`Royal Jelly: ${s.jellyBalance}`);

    this._rows.forEach(({ def, levelText, btn }) => {
      const level = s.upgrades[def.key] ?? 0;
      const maxed = level >= def.max;
      const canAfford = s.jellyBalance >= def.cost;

      levelText.setText(`${level} / ${def.max}`);

      if (maxed) {
        btn.setText('MAXED');
        btn.setColor('#555555');
        btn._enabled = false;
      } else if (canAfford) {
        btn.setText(`[ BUY ${def.cost}j ]`);
        btn.setColor('#ffd700');
        btn._enabled = true;
      } else {
        btn.setText(`[ BUY ${def.cost}j ]`);
        btn.setColor('#555555');
        btn._enabled = false;
      }
    });
  }
}
```

- [ ] **Step 2: Run full test suite**

```
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 3: Commit**

```
git add src/scenes/MetaUpgradeScene.js
git commit -m "feat: MetaUpgradeScene with full upgrade purchase UI"
```

---

### Task 5: GameScene — apply meta upgrades at run start

**Files:**
- Modify: `src/scenes/GameScene.js` (import MetaSave, apply upgrades in `create()`)
- Modify: `src/constants.js` (confirm HIVE.HONEY_STORAGE is accessible — no change needed)

The upgrade block runs **after** all entities are initialized in `create()`. The end of `create()` currently calls `this.waveManager` setup and HUD init — insert the block before those, after hive/player/resources exist.

- [ ] **Step 1: Add MetaSave import to GameScene**

At the top of `src/scenes/GameScene.js`, after the existing imports, add:

```js
import MetaSave from '../systems/MetaSave.js';
```

- [ ] **Step 2: Apply meta upgrades in `create()`**

Find the line in `GameScene.create()` that reads:

```js
    this.physics.add.overlap(this.stingers, this.wasps, (stinger, wasp) => {
```

Insert the following block **before** that line (after `this.player`, `this.hive`, and `this.resources` are all initialized):

```js
    // Apply meta-progression upgrades from save
    const _metaSave = MetaSave.load();
    const _u = _metaSave.upgrades;

    if (_u.BEE_SPEED_META)    this.player._speed += _u.BEE_SPEED_META * 20;
    if (_u.BEE_HP_META)       { this.player.maxHp += _u.BEE_HP_META * 2; this.player.hp = this.player.maxHp; }
    if (_u.HIVE_HP_META)      { this.hive.maxHp   += _u.HIVE_HP_META * 5; this.hive.hp  = this.hive.maxHp; }
    if (_u.HIVE_STORAGE_META) this.resources.setHoneyStorage(HIVE.HONEY_STORAGE + _u.HIVE_STORAGE_META * 50);

    if (_u.START_WORKER) {
      const _w = new WorkerBee(this, this.hiveX, this.hiveY);
      _w.init(this.hive, this.flowers);
      this.workers.add(_w);
    }
    if (_u.START_ARMOR)  this.player.armor = 1;
    if (_u.START_HONEY)  { this.resources.addPendingSap(30); this.resources.convertSap(30); }
    if (_u.START_GUARD)  {
      const _post = new GuardPost(this, this.hiveX + 80, this.hiveY);
      this._towerList.push(_post);
    }
```

- [ ] **Step 3: Verify PlayerBee and Hive expose the expected properties**

Check that `PlayerBee` has `_speed`, `maxHp`, `hp`, and `armor` properties, and `Hive` has `maxHp` and `hp`. Run a quick grep:

```
npx grep -n "_speed\|maxHp\|this\.hp\|this\.armor" src/entities/PlayerBee.js src/entities/Hive.js
```

If any property is missing, add it to the entity constructor (e.g., `this.armor = 0;`). Expected output should show these properties are already set.

- [ ] **Step 4: Run full test suite**

```
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```
git add src/scenes/GameScene.js
git commit -m "feat: apply meta upgrades to GameScene entities at run start"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task covering it |
|---|---|
| `MetaSave` static class with load/save/addJelly/purchaseUpgrade/getUpgradeLevel/reset | Task 1 |
| `bee-game-save` localStorage key, DEFAULTS factory | Task 1 |
| Load returns defaults on missing/corrupt JSON | Task 1 (tests) |
| Royal jelly = `Math.floor(score / 10)` | Task 2 (`init`) |
| `lastRun` and `highScore` updated after each run | Task 2 |
| GameOverScene shows score, +jelly, waves, time, high score | Task 2 |
| GameOverScene single `[ BACK TO MENU ]` button | Task 2 |
| `GameScene._endGame` passes waves + timeSurvived | Task 2 |
| MenuScene `[ UPGRADES ]` button → MetaUpgradeScene | Task 3 |
| MetaUpgradeScene header shows current jelly balance | Task 4 |
| 8 upgrade rows with name/level/max/cost/button | Task 4 |
| Button dim when can't afford or maxed | Task 4 (`_refresh`) |
| BEE_SPEED_META +20/level, BEE_HP_META +2/level | Task 5 |
| HIVE_HP_META +5/level, HIVE_STORAGE_META +50/level | Task 5 |
| START_WORKER spawns WorkerBee bypassing cost | Task 5 |
| START_ARMOR sets `player.armor = 1` | Task 5 |
| START_HONEY gives 30 honey via addPendingSap/convertSap | Task 5 |
| START_GUARD constructs GuardPost bypassing `_placeTower` | Task 5 |

All spec requirements covered. No gaps found.

**Placeholder scan:** None found — all steps contain complete code.

**Type consistency check:**
- `MetaSave.purchaseUpgrade(key, cost)` defined Task 1, used Task 4 — matches.
- `MetaSave.addJelly(earned)` defined Task 1, used Task 2 — matches.
- `MetaSave.load()` / `MetaSave.save(s)` defined Task 1, used Tasks 2, 4 — matches.
- `_refresh()` defined and called Task 4 — matches.
- `WorkerBee._w.init(hive, flowers)` — matches WorkerBee API from existing codebase.
- `resources.addPendingSap(30); resources.convertSap(30)` — matches ResourceManager API.
