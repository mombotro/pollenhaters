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
