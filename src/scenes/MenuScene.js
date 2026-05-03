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
