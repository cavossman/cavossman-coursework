"use strict";

const Vector = require('../vector');

const SPEED = 4;

/**
 * @module exports the EnemyShot class
 */
module.exports = exports = EnemyShot;


/**
 * @constructor EnemyShot
 * Creates a new enemyShot object
 * @param {Postition} position object specifying an x and y
 */
function EnemyShot(position, playerPos) {
  this.worldWidth = 810;
  this.worldHeight = 786;
  var direction = Vector.subtract(position, playerPos);
  var position = Vector.add(position, {x:30, y:30});
  this.velocity = Vector.scale(Vector.normalize(direction), SPEED);

  this.position = {
    x: position.x,
    y: position.y
  };
  this.image = new Image();
  this.image.src = 'assets/shots/enemy_shot.png';
  this.radius = 5;
  this.remove = false;
}


/**
 * @function updates the enemyShot object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
EnemyShot.prototype.update = function(time) {
  // Apply velocity
  this.position.x -= this.velocity.x;
  this.position.y -= this.velocity.y;

  if(this.position.x < -50 || this.position.x > this.worldWidth ||
     this.position.y < -50 || this.position.y > this.worldHeight){
    this.remove = true;;
  }
}

/**
 * @function renders the enemyShot into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
EnemyShot.prototype.render = function(time, ctx) {
    ctx.drawImage(this.image, 0 ,0, 11, 11, this.position.x, this.position.y, 10, 10);  
}
