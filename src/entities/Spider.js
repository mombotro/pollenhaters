import Phaser from 'phaser';
import { SPIDER } from '../constants.js';

export default class Spider extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'spider');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this._target = null;
    this._lastTarget = null;
    this._dwelling = false;
    this._dwellStart = 0;
    this.setDrag(800, 800);
  }

  // flowers: Phaser staticGroup
  // onPlaceWeb: callback (x, y) => void
  update(time, delta, flowers, onPlaceWeb) {
    if (!this._target || !this._target.active) {
      this._findTarget(flowers);
    }
    if (!this._target) {
      this.setAcceleration(0, 0);
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this._target.x, this._target.y);
    if (!this._dwelling && dist > 40) {
      this._movePhysics(this._target.x, this._target.y, SPIDER.SPEED);
    } else {
      this.setAcceleration(0, 0);
      this.setVelocity(0, 0);
      if (!this._dwelling) {
        this._dwelling = true;
        this._dwellStart = time;
      } else if (time - this._dwellStart >= SPIDER.WEB_PLACE_TIME) {
        let f2 = null;
        let f2Dist = Infinity;
        flowers.getChildren().forEach(f => {
          if (f === this._target || !f.active) return;
          const d = Phaser.Math.Distance.Between(this._target.x, this._target.y, f.x, f.y);
          if (d < 400 && d < f2Dist) { f2 = f; f2Dist = d; }
        });
        
        if (f2) {
          onPlaceWeb(this._target, f2);
        }
        this._dwelling = false;
        this._lastTarget = this._target;
        this._target = null;
      }
    }
  }

  _findTarget(flowers) {
    const active = flowers.getChildren().filter(f => f.active && f !== this._lastTarget);
    if (!active.length) {
      this._target = null;
      return;
    }
    this._target = active[Math.floor(Math.random() * active.length)];
  }

  _movePhysics(tx, ty, speed) {
    this.setMaxVelocity(speed, speed);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, tx, ty);
    if (dist > 5) {
      const ax = (tx - this.x) / dist;
      const ay = (ty - this.y) / dist;
      this.setAcceleration(ax * speed * 10, ay * speed * 10);
    } else {
      this.setAcceleration(0, 0);
    }
  }
}
