"use strict";
module.exports = exports = Missile;
function Missile(maxSize) {
  this.pool = new Float32Array(4 * maxSize);
  this.end = 0;
  this.max = maxSize;
}