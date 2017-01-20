"use strict";

const SPEED = 3;

/**
 * @module exports the Powerup class
 */
module.exports = exports = Powerup;


/**
 * @constructor Powerup
 * Creates a new powerup object
 * @param {Postition} position object specifying an x and y
 */
function Powerup(position, startTime, type) {
    this.startTime = startTime;
    this.worldWidth = 850;
    this.worldHeight = 800;
    this.type = type;
    this.position = {
        x: position.x,
        y: position.y
    };
    this.image = new Image();
    this.image.src = 'assets/powerups/powerup_' + type + '.png';
    this.remove = false;
    this.imgWidth = 20;
    this.imgHeight = 21;
    this.width = 2*this.imgWidth;
    this.height = 2*this.imgHeight;
    this.radius = this.width/2;
}


/**
 * @function updates the powerup object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Powerup.prototype.update = function(time) {
  // Apply velocity
  this.position.y += SPEED;

  if(this.position.x < -50 || this.position.x > this.worldWidth + 50 ||
     this.position.y < -50 || this.position.y > this.worldHeight + 50){
    this.remove = true;;
  }
}

/**
 * @function renders the powerup into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Powerup.prototype.render = function(time, ctx) {
    ctx.drawImage(this.image,
                  0, 0, this.imgWidth, this.imgHeight,
                  this.position.x, this.position.y, this.width, this.height
                  );  
}
