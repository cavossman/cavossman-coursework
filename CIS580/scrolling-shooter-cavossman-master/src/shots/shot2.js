"use strict";

const SPEED = 8;
const SmokeParticles = require('../smoke_particles');

/**
 * @module exports the Shot2 class
 */
module.exports = exports = Shot2;


/**
 * @constructor Shot2
 * Creates a new shot2 object
 * @param {Postition} position object specifying an x and y
 */
function Shot2(position, direction) {
  this.worldWidth = 850;
  this.worldHeight = 750;
  this.direction = direction
  this.position = {
    x: position.x + 11,
    y: position.y
  };
  this.image = new Image();
  this.smokeParticles = new SmokeParticles(400, '124,252,0');
  this.image.src = 'assets/shots/shots_2.png';
  this.remove = false;
  this.width = 18;
  this.height = 18;
  this.draw_width = 18;
  this.draw_height = 18;
  this.particleTimer = 5;
}


/**
 * @function updates the shot2 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Shot2.prototype.update = function(time) {
  // Apply velocity
  this.position.y -= SPEED;
  this.position.x += SPEED * this.direction;

  if(this.position.x < -200 || this.position.x > this.worldWidth + 200||
     this.position.y < -200 || this.position.y > this.worldHeight + 200){
    this.remove = true;;
  }
  this.particleTimer--;
  if(this.particleTimer <= 0){
    if(this.direction == 1)
    this.smokeParticles.emit({x: this.position.x + 10, y: this.position.y + 25});  
    else if(this.direction == -1)
    this.smokeParticles.emit({x: this.position.x, y: this.position.y + 18});      
    this.particleTimer = 5;
  }
  this.smokeParticles.update(time);
}

/**
 * @function renders the shot2 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Shot2.prototype.render = function(time, ctx) {
    ctx.translate(this.position.x, this.position.y);
    ctx.drawImage(this.image, 6 + 6*this.direction ,0, 12, 12, 0, 20, this.draw_width, this.draw_height);  
    ctx.translate(-this.position.x, -this.position.y);

    this.smokeParticles.render(time, ctx);    
}
