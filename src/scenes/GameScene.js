import Phaser from 'phaser';
import { WORLD, BEE, HIVE, WASP, WAVE, FLOWER, TIMER } from '../constants.js';
import Flower from '../entities/Flower.js';
import Hive from '../entities/Hive.js';
import ResourceManager from '../systems/ResourceManager.js';
import PollinationSystem from '../systems/PollinationSystem.js';
import PlayerBee from '../entities/PlayerBee.js';
import Stinger from '../entities/Stinger.js';
import WaveManager from '../systems/WaveManager.js';
import HunterWasp from '../entities/HunterWasp.js';
import RaiderWasp from '../entities/RaiderWasp.js';
import HUD from '../ui/HUD.js';

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

    this._spawnInitialFlowers();

    this.hive = new Hive(this, this.hiveX, this.hiveY);

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

    // Deposit sap when player overlaps hive
    this.physics.add.overlap(this.player, this.hive, () => {
      if (this.resources.getSapCarried('player') > 0) {
        this.resources.depositSap('player');
      }
    });

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

    // Win: survive full run duration
    this.time.delayedCall(TIMER.RUN_DURATION, () => this._endGame(true));

    this.hud = new HUD(this, this.resources, this.hive, this.player);
  }

  update(time, delta) {
    if (this.hud) this.hud.update(time, this.waveManager.getWaveNumber());
    this.pollination.update(time);
    if (this.player.alive) this.player.update(time, delta);
    this.wasps.getChildren().forEach(w => w.update());
    const wave = this.waveManager.update(time);
    if (wave) this._spawnWave(wave);
  }

  _spawnInitialFlowers() {
    for (let i = 0; i < FLOWER.INITIAL_COUNT; i++) {
      const x = Phaser.Math.Between(100, WORLD.WIDTH - 100);
      const y = Phaser.Math.Between(100, WORLD.HEIGHT - 100);
      const f = new Flower(this, x, y);
      this.flowers.add(f);       // staticGroup.add() creates the static body
      this.flowers.refresh();    // refresh static group bounds after adding
    }
  }

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
}
