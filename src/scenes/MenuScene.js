import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    this._selIdx = 0;
    this._gpAWasDown = false;
    this._gpDirWasDown = false;
    const cx = 640, cy = 360;

    this.add.dom(cx, cy - 260).createFromHTML(`
      <div style="position:relative;width:300px;text-align:center;">
        <img src="bee.gif" style="width:180px;display:block;margin:-40px auto 0;">
        <img src="splash.png" style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:800px;z-index:1;">
      </div>
    `);

    this.add.text(cx, cy + 90, 'Protect the hive. Survive 10 minutes.', {
      fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5);

    const btnStart = this.add.text(cx, cy + 170, '[ START ]', {
      fontSize: '36px', color: '#ffd700',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnStart.on('pointerover', () => { this._selIdx = 0; this._refreshHighlight(); });
    btnStart.on('pointerout',  () => this._refreshHighlight());
    btnStart.on('pointerdown', () => this.scene.start('GameScene'));

    const btnUpgrades = this.add.text(cx, cy + 225, '[ UPGRADES ]', {
      fontSize: '28px', color: '#ffd700',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnUpgrades.on('pointerover', () => { this._selIdx = 1; this._refreshHighlight(); });
    btnUpgrades.on('pointerout',  () => this._refreshHighlight());
    btnUpgrades.on('pointerdown', () => this.scene.start('MetaUpgradeScene'));

    const btnPlayground = this.add.text(cx, cy + 275, '[ PLAYGROUND ]', {
      fontSize: '22px', color: '#ffd700',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnPlayground.on('pointerover', () => { this._selIdx = 2; this._refreshHighlight(); });
    btnPlayground.on('pointerout',  () => this._refreshHighlight());
    btnPlayground.on('pointerdown', () => this.scene.start('GameScene', { playground: true }));

    this._btns = [btnStart, btnUpgrades, btnPlayground];
    this._actions = [
      () => this.scene.start('GameScene'),
      () => this.scene.start('MetaUpgradeScene'),
      () => this.scene.start('GameScene', { playground: true }),
    ];
    this._refreshHighlight();
  }

  _refreshHighlight() {
    this._btns.forEach((b, i) =>
      b.setColor(i === this._selIdx ? '#ffffff' : '#ffd700')
    );
  }

  update() {
    const gp = this.input.gamepad;
    const pad = gp?.total > 0 ? gp.gamepads.find(p => p?.connected) : null;
    if (!pad) return;

    // D-pad / left stick navigate
    const dirDown = pad.buttons[12]?.pressed || pad.buttons[13]?.pressed ||
                    Math.abs(pad.leftStick.y) > 0.4;
    if (dirDown && !this._gpDirWasDown) {
      const dy = pad.buttons[12]?.pressed || pad.leftStick.y < -0.4 ? -1 : 1;
      this._selIdx = (this._selIdx + dy + this._btns.length) % this._btns.length;
      this._refreshHighlight();
    }
    this._gpDirWasDown = dirDown;

    // A confirms
    const aDown = pad.buttons[0]?.pressed ?? false;
    if (aDown && !this._gpAWasDown) this._actions[this._selIdx]();
    this._gpAWasDown = aDown;
  }
}
