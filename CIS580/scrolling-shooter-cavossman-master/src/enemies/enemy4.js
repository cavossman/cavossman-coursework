"use strict";

const MS_PER_FRAME = 1000/8;

const EnemyShot = require('../shots/enemy_shot');
const Explosion = require('../explosion');

var explosion_colors = ['105,99,89,', '240,46,46,', '255,175,46,'];
/**
 * @module exports the Enemy4 class
 */
module.exports = exports = Enemy4;


/**
 * @constructor Enemy4
 * Creates a new enemy4 object
 * @param {Postition} position object specifying an x and y
 */
function Enemy4(position, startTime, acceleration, level, enemyShots, explosions) {
    this.level = level;    
    this.startTime = startTime;
    this.worldWidth = 850;
    this.worldHeight = 800;
    this.acceleration = acceleration; 
    this.position = {
        x: position.x,
        y: position.y
    };
    this.velocity = {
        x: 8 * this.acceleration,
        y: 5
    }
    this.image = new Image();
    this.image.src = 'assets/enemies/enemy_4.png';
    this.remove = false;
    this.frame = 0;
    this.frameTimer = MS_PER_FRAME;
    this.imgWidth = 24;
    this.imgHeight = 18;
    this.width = 2*this.imgWidth;
    this.height = 2*this.imgHeight;
    this.enemyShots = enemyShots;
    this.explosions = explosions;    
    this.shotWait = 1500 - 150*this.level;
    this.shotTimer = this.shotWait;
}


/**
 * @function updates the enemy4 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Enemy4.prototype.update = function(time, playerPos) {
    this.frameTimer -= time;
    if(this.frameTimer <= 0){
        this.frameTimer = MS_PER_FRAME;
        this.frame++;
        if(this.frame >= 5){
            this.frame = 0;
        }
    }

    // Apply velocity
    this.position.y += this.velocity.y;
    this.position.x += this.velocity.x;

    // Apply acceleration
    this.velocity.x -= this.acceleration/10;

    this.shotTimer -= time;
    if(this.shotTimer <= 0){
        this.enemyShots.push(new EnemyShot({x: this.position.x -12,
                                            y: this.position.y - 10},
                                            playerPos));
        this.shotTimer = this.shotWait;
    }  

    if(this.position.x < -50 || this.position.x > this.worldWidth + 50 ||
        this.position.y < -50 || this.position.y > this.worldHeight + 50){
        this.remove = true;;
    }
}


/**
 * @function
 */
Enemy4.prototype.struck = function() {
    this.explosions.push(new Explosion({x: this.position.x + this.imgWidth,
                                        y: this.position.y + this.imgHeight}, 
                                        explosion_colors));
    this.remove = true;                                        
}

/**
 * @function renders the enemy4 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Enemy4.prototype.render = function(time, ctx) {
    ctx.drawImage(this.image,
                  this.imgWidth*this.frame, 0, this.imgWidth, this.imgHeight,
                  this.position.x, this.position.y, this.width, this.height
                  );  
}
