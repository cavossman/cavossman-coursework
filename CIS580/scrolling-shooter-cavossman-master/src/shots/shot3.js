"use strict";

const SPEED = 5;
const SmokeParticles = require('../smoke_particles');

/**
 * @module exports the Shot3 class
 */
module.exports = exports = Shot3;


/**
 * @constructor Shot3
 * Creates a new shot3 object
 * @param {Postition} position object specifying an x and y
 */
function Shot3(position, level) {
  this.worldWidth = 850;
  this.worldHeight = 750;
  this.level = level;
  this.position = {
    x: position.x + 11,
    y: position.y
  };
  this.image = new Image();
  this.image.src = 'assets/shots/shots_3.png';
  this.remove = false;
  this.smokeParticles = new SmokeParticles(400, '160, 160, 160');  
  this.draw_height = 28;
  this.draw_width = 18;
  this.particleTimer = 2;
  switch(level){
    case 0:
      this.width = 14;
      this.height = 26;
      break;
    case 1: 
      this.width = 18;
      this.height = 28;
  }
}


/**
 * @function updates the shot3 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Shot3.prototype.update = function(time) {
  // Apply velocity
  this.position.y -= SPEED;

  if(this.position.x < -50 || this.position.x > this.worldWidth ||
     this.position.y < -200 || this.position.y > this.worldHeight){
    this.remove = true;;
  }


  this.particleTimer--;
  if(this.particleTimer <= 0){

    this.smokeParticles.emit({x: this.position.x + 9, y: this.position.y + 50});  

    this.particleTimer = 2;
  }  

  this.smokeParticles.update(time);
}

/**
 * @function renders the shot3 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Shot3.prototype.render = function(time, ctx) {
    ctx.translate(this.position.x, this.position.y);
    ctx.drawImage(this.image, 9*this.level ,0, 9, 14, 0, 20, 18, 28);  
    ctx.translate(-this.position.x, -this.position.y);
    
  this.smokeParticles.render(time, ctx);
}
