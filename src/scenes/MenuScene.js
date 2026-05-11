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

    const btnControls = this.add.text(cx, cy + 315, '[ CONTROLS ]', {
      fontSize: '20px', color: '#ffd700',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnControls.on('pointerover', () => { this._selIdx = 3; this._refreshHighlight(); });
    btnControls.on('pointerout',  () => this._refreshHighlight());
    btnControls.on('pointerdown', () => this._showControls());

    this._btns = [btnStart, btnUpgrades, btnPlayground, btnControls];
    this._actions = [
      () => this.scene.start('GameScene'),
      () => this.scene.start('MetaUpgradeScene'),
      () => this.scene.start('GameScene', { playground: true }),
      () => this._showControls(),
    ];
    this._refreshHighlight();
  }

  _showControls() {
    if (this._controlsPanel) return;
    const cx = 640, cy = 360;
    const panel = this.add.container(0, 0).setDepth(300);

    const bg = this.add.rectangle(cx, cy, 760, 480, 0x000000, 0.93);
    const title = this.add.text(cx, cy - 210, 'CONTROLS', {
      fontSize: '30px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    const s = { fontSize: '17px', color: '#ffffff', fontFamily: 'monospace' };
    const h = { ...s, color: '#ffdd44', fontSize: '19px', fontStyle: 'bold' };
    const lh = 32, top = cy - 150;

    const kbLines  = ['KEYBOARD', 'WASD / Arrows  —  Move', 'Space          —  Dash', 'Right-click    —  Aim', 'B              —  Build menu'];
    const gpLines  = ['CONTROLLER', 'Left stick     —  Move', 'A button       —  Dash', 'Right stick    —  Aim', 'D-pad          —  Menus'];

    const texts = [];
    kbLines.forEach((label, i) => {
      texts.push(this.add.text(col1, top + i * lh, label, i === 0 ? h : s).setOrigin(0, 0.5));
    });
    gpLines.forEach((label, i) => {
      texts.push(this.add.text(col2, top + i * lh, label, i === 0 ? h : s).setOrigin(0, 0.5));
    });

    const btnClose = this.add.text(cx, cy + 210, '[ CLOSE ]', {
      fontSize: '22px', color: '#ff4444', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnClose.on('pointerover', () => btnClose.setColor('#ff8888'));
    btnClose.on('pointerout',  () => btnClose.setColor('#ff4444'));
    btnClose.on('pointerdown', () => this._hideControls());

    panel.add([bg, title, ...texts, btnClose]);
    this._controlsPanel = panel;
  }

  _hideControls() {
    if (!this._controlsPanel) return;
    this._controlsPanel.destroy(true);
    this._controlsPanel = null;
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
