"use strict";

const SPEED = 8;
const SmokeParticles = require('../smoke_particles');

/**
 * @module exports the Shot4 class
 */
module.exports = exports = Shot4;


/**
 * @constructor Shot4
 * Creates a new shot4 object
 * @param {Postition} position object specifying an x and y
 */
function Shot4(position, direction, level) {
  this.worldWidth = 850;
  this.worldHeight = 750;
  this.direction = direction;
  this.level = level;
  this.smokeParticles = new SmokeParticles(400, '255,255,102');
  this.position = {
    x: position.x + 11 + 10*this.direction,
    y: position.y
  };
  this.image = new Image();
  this.image.src = 'assets/shots/shots_4.png';
  this.remove = false;
  this.draw_height = 20;
  this.draw_width = 28;  
  this.particleTimer = 5;  
  switch(level){
    case 0: 
      this.width = 14;
      this.height = 14;
      break;

    case 1:
      this.width = 24;
      this.height = 18;
      break;

    case 2:
      this.width = 28;
      this.height = 20;
      break;
  }
}


/**
 * @function updates the shot4 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Shot4.prototype.update = function(time) {
  // Apply velocity
  this.position.x += SPEED * this.direction;

  if(this.position.x < -200 || this.position.x > this.worldWidth + 200||
     this.position.y < -200 || this.position.y > this.worldHeight + 200){
    this.remove = true;;
  }

  this.particleTimer--;
  if(this.particleTimer <= 0){
    this.smokeParticles.emit({x: this.position.x + 10, y: this.position.y + 28});      
    this.particleTimer = 5;
  }
  this.smokeParticles.update(time);  
}

/**
 * @function renders the shot4 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Shot4.prototype.render = function(time, ctx) {
    ctx.translate(this.position.x, this.position.y);
    ctx.drawImage(this.image, 28*this.level + 7 + 7*this.direction ,0, 14, 10, 0, 20, this.draw_width, this.draw_height );  
    ctx.translate(-this.position.x, -this.position.y);

    this.smokeParticles.render(time, ctx);
}
