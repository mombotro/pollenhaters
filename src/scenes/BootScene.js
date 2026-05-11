import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    this.load.image('player-bee', 'bee.png');
    this.load.image('splash', 'splash.png');
    this.load.image('wasp', 'wasp.png');
    this.load.spritesheet('flower', 'flowers-sheet.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('grass-deco', 'grass-sheet.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('hives', 'hives.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('pickups', 'pickups.png', { frameWidth: 400, frameHeight: 400 });
  }

  create() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });



    // stinger: small white rectangle
    g.clear();
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 8, 3);
    g.generateTexture('stinger', 8, 3);

    // guard-bee: blue circle
    g.clear();
    g.fillStyle(0x4488ff);
    g.fillCircle(14, 14, 12);
    g.generateTexture('guard-bee', 28, 28);

    // stinger-turret: dark grey hexagon approximated as circle with ring
    g.clear();
    g.fillStyle(0x444444);
    g.fillCircle(20, 20, 18);
    g.fillStyle(0x888888);
    g.fillCircle(20, 20, 10);
    g.generateTexture('stinger-turret', 40, 40);

    // resin-trap: amber translucent blob
    g.clear();
    g.fillStyle(0xcc8800, 0.7);
    g.fillCircle(24, 24, 22);
    g.generateTexture('resin-trap', 48, 48);

    // guard-post: brown square with inner diamond
    g.clear();
    g.fillStyle(0x886633);
    g.fillRect(0, 0, 40, 40);
    g.fillStyle(0xffcc00);
    g.fillRect(10, 10, 20, 20);
    g.generateTexture('guard-post', 40, 40);

    // butterfly: small cyan wing-diamond shape
    g.clear();
    g.fillStyle(0x00dddd);
    g.fillTriangle(10, 0, 0, 16, 20, 16);
    g.fillStyle(0x00aaaa);
    g.fillTriangle(10, 20, 0, 4, 20, 4);
    g.generateTexture('butterfly', 20, 20);

    // spider: small dark grey circle with leg hints
    g.clear();
    g.fillStyle(0x222222);
    g.fillCircle(10, 10, 8);
    g.lineStyle(1, 0x444444, 1);
    g.strokeRect(2, 4, 16, 12);
    g.generateTexture('spider', 20, 20);

    // web: concentric white rings (semi-transparent)
    g.clear();
    g.lineStyle(2, 0xffffff, 0.7);
    g.strokeCircle(24, 24, 22);
    g.strokeCircle(24, 24, 14);
    g.strokeCircle(24, 24, 6);
    g.lineStyle(1, 0xffffff, 0.4);
    g.lineBetween(2, 24, 46, 24);
    g.lineBetween(24, 2, 24, 46);
    g.lineBetween(7, 7, 41, 41);
    g.lineBetween(41, 7, 7, 41);
    g.generateTexture('web', 48, 48);

    g.destroy();
    this.scene.start('MenuScene');
  }
}
