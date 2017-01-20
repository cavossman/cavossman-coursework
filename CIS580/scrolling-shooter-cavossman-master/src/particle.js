"use strict";

var fHz = 1000/60; // The update frequency

/**
 * @module exports the Particle class
 */
module.exports = exports = Particle;


/**
 * @constructor Particle
 * Creates a new particle object
 * @param {Postition} position object specifying an x and y
 */
function Particle(position, radius, color, scaleSpeed, velocity) {
  	this.position = position;        // The coordinates of the particle.
	this.radius = radius;               // The radius of the particle.
	this.color = color;         // RGB color value of particle (hexadecimal notation).
	this.scale = 1.0;               // Scaling value between 0.0 and 1.0, initialized to 1.0.
	this.scaleSpeed = scaleSpeed;          // Amount per second to be deduced from the scale property.
	this.velocity = velocity;   // Amount to be added per second to the particle’s position.
    this.remove = false;
}


/**
 * @function updates the particle object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Particle.prototype.update = function(time) {
    var ms = fHz;
    
    // Shrink the particle based on the scaleSpeed value
    this.scale -= this.scaleSpeed * ms / 1000.0;

    if (this.scale <= 0)
    {
        this.scale = 0;
        this.remove = true;
        return;
    }
    // moving away from explosion center
    this.position.x += this.velocity.x * ms/1000.0;
    this.position.y += this.velocity.y * ms/1000.0;
}

/**
 * @function renders the particle into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Particle.prototype.render = function(time, ctx) {
    ctx.beginPath();
    ctx.arc(
      this.position.x,   // X position
      this.position.y, // y position
      this.radius*this.scale, // radius
      0,
      2*Math.PI
    );
    ctx.fillStyle = 'rgba(' + this.color + this.scale + ')';
    ctx.fill();

}

