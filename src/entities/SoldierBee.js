import Phaser from 'phaser';
import { SOLDIER, DEPTH } from '../constants.js';
import Stinger from './Stinger.js';

export default class SoldierBee extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player-bee');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.ENTITY);
    this.setCollideWorldBounds(true);
    this.setScale(0.55);
    this.setTint(0xff8800);
    this.alive = true;
    this.hp = SOLDIER.HP;
    this.maxHp = SOLDIER.HP;
    this.damage = SOLDIER.DAMAGE;
    this.range = SOLDIER.RANGE;
    this.fireRate = SOLDIER.FIRE_RATE;
    this._lastFired = 0;
    this._phaseOffset = Math.random() * Math.PI * 2;
    this.setDrag(800, 800);
  }

  update(time, player, wasps, breakables, stingers) {
    if (!this.alive || !player.alive) return;

    const angle = (time / 2000) * Math.PI * 2 + this._phaseOffset;
    const tx = player.x + Math.cos(angle) * SOLDIER.ORBIT_RADIUS;
    const ty = player.y + Math.sin(angle) * SOLDIER.ORBIT_RADIUS;
    this._movePhysics(tx, ty, SOLDIER.SPEED);

    if (time - this._lastFired < this.fireRate) return;

    let target = null;
    let targetDist = this.range;

    wasps.getChildren().forEach(w => {
      if (!w.active) return;
      const d = Phaser.Math.Distance.Between(this.x, this.y, w.x, w.y);
      if (d < targetDist) { target = w; targetDist = d; }
    });

    breakables.getChildren().forEach(b => {
      if (!b.active) return;
      const d = Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y);
      if (d < targetDist) { target = b; targetDist = d; }
    });

    if (!target) return;

    let s = stingers.getFirstDead(false);
    if (!s) { s = new Stinger(this.scene, 0, 0); stingers.add(s); }
    s.fire(this.x, this.y, this.damage, this.range, null, target.x, target.y);
    this._lastFired = time;
  }

  takeDamage(amount) {
    if (!this.alive) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.setTint(0xff4444);
    this.scene.time.delayedCall(150, () => { if (this.active) this.setTint(0xff8800); });
    if (this.hp <= 0) {
      this.alive = false;
      this.setVisible(false).setActive(false);
      if (this.body) this.body.enable = false;
      return true;
    }
    return false;
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
