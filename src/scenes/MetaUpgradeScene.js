import Phaser from 'phaser';

export default class MetaUpgradeScene extends Phaser.Scene {
  constructor() { super('MetaUpgradeScene'); }
  create() {
    this.add.text(640, 360, 'Meta Upgrades (Plan 4)', {
      fontSize: '32px', color: '#ffffff',
    }).setOrigin(0.5);
  }
}
