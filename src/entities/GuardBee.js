import Phaser from 'phaser';
import { TOWER, DEPTH } from '../constants.js';
import Stinger from './Stinger.js';

export default class GuardBee extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, post) {
    super(scene, x, y, 'player-bee');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.ENTITY);
    this.setScale(0.5).setTint(0x4488ff);
    this.setCollideWorldBounds(true);
    this.hp = TOWER.GUARD_BEE_HP;
    this.maxHp = TOWER.GUARD_BEE_HP;
    this.alive = true;
    this._post = post;
    this._lastFired = 0;
    this.setDrag(800, 800);
  }

  update(time, wasps, stingers) {
    if (!this.alive) return;

    // Orbit the guard post
    const angle = (time / 2000) * Math.PI * 2;
    const tx = this._post.x + Math.cos(angle) * 44;
    const ty = this._post.y + Math.sin(angle) * 44;
    this._movePhysics(tx, ty, TOWER.GUARD_BEE_SPEED);

    // Auto-fire at nearest wasp in range
    if (time - this._lastFired < TOWER.GUARD_BEE_RATE) return;
    let nearest = null, nearestDist = TOWER.GUARD_BEE_RANGE;
    wasps.getChildren().forEach(w => {
      if (!w.active) return;
      const d = Phaser.Math.Distance.Between(this.x, this.y, w.x, w.y);
      if (d < nearestDist) { nearest = w; nearestDist = d; }
    });
    if (!nearest) return;
    let s = stingers.getFirstDead(false);
    if (!s) {
      s = new Stinger(this.scene, 0, 0);
      stingers.add(s);
    }
    s.fire(this.x, this.y, TOWER.GUARD_BEE_DAMAGE, null, null, nearest.x, nearest.y);
    this._lastFired = time;
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

    if (this.body.velocity.lengthSq() > 10) {
      const targetRotation = this.body.velocity.angle() + Math.PI / 2;
      this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, targetRotation, 0.15);
    }
  }
}
