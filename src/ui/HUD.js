import Phaser from 'phaser';
import { TIMER } from '../constants.js';

export default class HUD {
  constructor(scene, resources, hive, player) {
    this._resources = resources;
    this._hive = hive;
    this._player = player;

    const s = { fontSize: '18px', color: '#ffd700', stroke: '#000', strokeThickness: 3 };

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
