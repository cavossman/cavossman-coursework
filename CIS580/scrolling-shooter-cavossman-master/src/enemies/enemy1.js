"use strict";

const SPEED = 5;
const MS_PER_FRAME = 1000/16;

const EnemyShot = require('../shots/enemy_shot');
const Explosion = require('../explosion');

var explosion_colors = ['105,99,89,', '240,46,46,', '255,175,46,'];
/**
 * @module exports the Enemy1 class
 */
module.exports = exports = Enemy1;


/**
 * @constructor Enemy1
 * Creates a new enemy1 object
 * @param {Postition} position object specifying an x and y
 */
function Enemy1(position, startTime, level, enemyShots, explosions) {
    this.level = level;
    this.startTime = startTime;
    this.worldWidth = 850;
    this.worldHeight = 800;
    this.position = {
      x: position.x,
      y: position.y
    };
    this.image = new Image();
    this.image.src = 'assets/enemies/enemy_1.png';
    this.remove = false;
    this.frame = 0;
    this.frameTimer = MS_PER_FRAME;
    this.imgWidth = 15;
    this.imgHeight = 19;
    this.width = 2*this.imgWidth;
    this.height = 2*this.imgHeight;
    this.enemyShots = enemyShots;
    this.explosions = explosions;    
    this.shotWait = 1500 - 150*this.level;
    this.shotTimer = this.shotWait;
}


/**
 * @function updates the enemy1 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Enemy1.prototype.update = function(time, playerPos) {
    this.frameTimer -= time;
    if(this.frameTimer <= 0){
        this.frameTimer = MS_PER_FRAME;
        this.frame++;
        if(this.frame >= 8){
            this.frame = 0;
        }
    }


    // Fire when ready
    this.shotTimer -= time;
    if(this.shotTimer <= 0){
        this.enemyShots.push(new EnemyShot({x: this.position.x - 20,
                                            y: this.position.y - 10},
                                            playerPos));
        this.shotTimer = this.shotWait;
    }


    // Apply velocity
    this.position.y += SPEED;

    if(this.position.x < -50 || this.position.x > this.worldWidth + 50 ||
      this.position.y < -50 || this.position.y > this.worldHeight + 50){
      this.remove = true;;
    }
}

/**
 * @function
 */
Enemy1.prototype.struck = function() {
    this.explosions.push(new Explosion({x: this.position.x + this.imgWidth,
                                        y: this.position.y + this.imgHeight}, 
                                        explosion_colors));
    this.remove = true;                                        
}

/**
 * @function renders the enemy1 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Enemy1.prototype.render = function(time, ctx) {
    ctx.drawImage(this.image,
                  this.imgWidth*this.frame, 0, this.imgWidth, this.imgHeight,
                  this.position.x, this.position.y, this.width, this.height
                  );  
}
