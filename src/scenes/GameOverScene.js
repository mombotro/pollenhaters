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
