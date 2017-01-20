"use strict";

const SPEED = 8;

/**
 * @module exports the Shot1 class
 */
module.exports = exports = Shot1;


/**
 * @constructor Shot1
 * Creates a new shot1 object
 * @param {Postition} position object specifying an x and y
 */
function Shot1(position, level) {
  this.worldWidth = 850;
  this.worldHeight = 750;
  this.position = {
    x: position.x + 11,
    y: position.y - 20
  };
  this.level = level;
  this.image = new Image();
  this.image.src = 'assets/shots/shots_1.png';
  this.remove = false;
  this.draw_height = 26;
  this.height = 26;
  this.draw_width = 24;
  switch(level){
    case 0:
      this.width = 8;
      break;
    case 1: 
      this.width = 10;
    case 2:
    case 3:
      this.width = 12;
  }
}


/**
 * @function updates the shot1 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Shot1.prototype.update = function(time) {
  // Apply velocity
  this.position.y -= SPEED;

  if(this.position.x < -50 || this.position.x > this.worldWidth ||
     this.position.y < -50 || this.position.y > this.worldHeight){
    this.remove = true;;
  }
}

/**
 * @function renders the shot1 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Shot1.prototype.render = function(time, ctx) {
    ctx.translate(this.position.x, this.position.y);
    ctx.drawImage(this.image, 12*this.level ,0, 12, 13, 0, 10, this.draw_width, this.draw_height);  
    ctx.translate(-this.position.x, -this.position.y);
}
