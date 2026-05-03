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
