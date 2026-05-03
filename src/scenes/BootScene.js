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
