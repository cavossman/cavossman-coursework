"use strict";

/* Classes and Libraries */
const Vector = require('./vector');
const Shot1 = require('./shots/shot1');
const Shot2 = require('./shots/shot2');
const Shot3 = require('./shots/shot3');
const Shot4 = require('./shots/shot4');
const Explosion = require('./explosion');

/* Constants */
const PLAYER_SPEED = 7;
const BULLET_SPEED = 14;
const SHOT_TIMER = 600;
const SHIELD_TIMER = 100;
const START_SHIELDS = 100;

var explosion_colors = ['105,99,89,', '240,46,46,', '255,175,46,'];

/**
 * @module Player
 * A class representing a player's helicopter
 */
module.exports = exports = Player;

/**
 * @constructor Player
 * Creates a player
 * @param {BulletPool} bullets the bullet pool
 */
function Player() {
  this.angle = 0;
  this.angle_offset = 0;
  this.position = {x: 405, y: 500};
  this.velocity = {x: 0, y: 0};
  this.img = new Image();
  this.img.src = 'assets/ship/ship.png';
  this.guns = new Image();
  this.guns.src = 'assets/ship/side_guns.png';
  this.shield = new Image();
  this.shield.src = 'assets/shield.png';
  this.shots = [];
  this.shotTimer = SHOT_TIMER;
  this.shotsToRemove = [0, 0, 0, 0];
  this.shotLevels = [0, -1, -1, -1];
  this.levelMaxes = [3, 0, 1, 2];
  this.shielding = false;
  this.shieldTimer = SHIELD_TIMER;
  this.shields = START_SHIELDS;
  this.lives = 3;
  this.state = 'ready';
  this.imgWidth = 23;
  this.imgHeight = 27;
  this.width = 2* this.imgWidth;
  this.draw_width = this.width;
  this.height = 2 * this.imgHeight;
  this.draw_height = this.height;
  this.explosion = null;
  this.powerups = [];
  for(var i = 1; i < 5; i++){
    this.powerups.push(new Image());
    this.powerups[i-1].src = 'assets/powerups/powerup_' + i + '.png';
  }
}

Player.prototype.debug = function(key){
  switch(key){
    case '1': 
      this.pickupPowerup(1);
      break;
    case '2': 
      this.pickupPowerup(2);
      break;
    case '3': 
      this.pickupPowerup(3);
      break;
    case '4': 
      this.pickupPowerup(4);
      break;
    case 'o': 
      this.shielding = true;
      break;
    case 'r': 
      this.shotLevels = [0, -1, -1, -1];
      break;   
  }
}

Player.prototype.struck = function(damage){
  if(this.shields > 0){
    this.shielding = true;
    this.shields -= damage;
  }
  else{
    // Destroy player
    this.explosion = new Explosion({x: this.position.x + this.imgWidth,
                                        y: this.position.y + this.imgHeight}, 
                                        explosion_colors);
    this.state = 'exploding';
    this.lives--;
  }
}

Player.prototype.pickupPowerup = function(powerup){
  if(this.shotLevels[powerup-1] < this.levelMaxes[powerup-1]){
    this.shotsToRemove[powerup-1]++;
    this.shotLevels[powerup-1]++;
  }
}

/**
 * @function update
 * Updates the player based on the supplied input
 * @param {DOMHighResTimeStamp} elapedTime
 * @param {Input} input object defining input, must have
 * boolean properties: up, left, right, down
 */
Player.prototype.update = function(elapsedTime, input) {
  this.velocity.x = 0;
  this.velocity.y = 0;
  if(this.shielding){
    this.shieldTimer -= elapsedTime;
    if(this.shieldTimer <= 0){
      this.shielding = false;
      this.shieldTimer = SHIELD_TIMER;
    }
  }

  if(this.state == 'running' || this.state == 'ready'){
    if(input.left) this.velocity.x -= PLAYER_SPEED;
    if(input.right) this.velocity.x += PLAYER_SPEED;
    if(input.up) this.velocity.y -= PLAYER_SPEED / 2;
    if(input.down) this.velocity.y += PLAYER_SPEED;
  }
  else if(this.state == 'finished'){
    this.velocity.y = -PLAYER_SPEED;
    if(this.position.y < -50){
      this.state = 'offscreen';
    }
  }
  else if(this.state == 'exploding'){
    this.explosion.update(elapsedTime);
    if(this.explosion._killed){
      this.state = 'dead';
    }
  }

  this.angle = 0;
  if(this.velocity.x < 0) this.angle = -1;
  if(this.velocity.x > 0) this.angle = 1;

  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;

  if(this.position.x < 10) this.position.x = 10;
  if(this.position.x > 750) this.position.x = 750;
  if(this.position.y > 750) this.position.y = 750;
  if(this.position.y < 36 && (this.state == 'running' || this.state == 'ready')) this.position.y = 36;

  this.shotTimer -= elapsedTime;

  if(input.firing && this.state == 'running'){
    if(this.shotTimer <= 0){
      this.shots.push(new Shot1(this.position, this.shotLevels[0]));
      if(this.shotLevels[1] >= 0){
        this.shots.push(new Shot2(this.position, -1));
        this.shots.push(new Shot2(this.position, 1));
      }
      var posx = this.position.x;
      var posy = this.position.y;
      if(this.shotLevels[2] >= 0){
        this.shots.push(new Shot3({x: posx - 27, y : posy}, this.shotLevels[2]));
        this.shots.push(new Shot3({x: posx + 33, y: posy}, this.shotLevels[2]));
      }
      if(this.shotLevels[3] >= 0){
        this.shots.push(new Shot4(this.position, -1, this.shotLevels[3]));
        this.shots.push(new Shot4(this.position, 1, this.shotLevels[3]));
      }
      this.shotTimer = SHOT_TIMER;
    }
  }

  var markedForRemoval = [];
  var self = this;
  for(var i = 0; i < this.shots.length; i++){
    this.shots[i].update(elapsedTime);
    if(this.shots[i].remove){
      markedForRemoval.unshift(i);
    }
  }
  markedForRemoval.forEach(function(index){
    self.shots.splice(index, 1);
  });
}

/**
 * @function render
 * Renders the player helicopter in world coordinates
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
Player.prototype.render = function(elapsedTime, ctx) {
  for(var i = 0; i < this.shots.length; i++){
    this.shots[i].render(elapsedTime, ctx);
  }

  if(this.state == 'exploding'){
    this.explosion.render(elapsedTime, ctx);
  }

  var offset = this.angle * 21;
  ctx.save();
  ctx.translate(this.position.x, this.position.y);

  if(this.state != 'dead' && this.state != 'exploding'){
    // Draw ship
    ctx.drawImage(this.img, 42+offset, 0, 21, 27, 0, 0, this.draw_width, this.draw_height);
    if(this.shotLevels[2] >= 0){
      ctx.drawImage(this.guns, 0 ,0, 41, 13, -18, 15, 82, 26);
    }

    // Draw shield
    if(this.shielding){
      ctx.drawImage(this.shield, 0 ,0, 2000, 2417, -11, -5, 70, 70); 
	  //ctx.ellipse(-11, -5, 30, 30, 0, 0, 2 * Math.PI);
    }
  }
  ctx.restore();
}

/**
 * @function restart
 * 
 * @param {} 
 */
Player.prototype.restart = function(restart) {
  this.angle = 0;
  this.angle_offset = 0;
  this.position = {x: 405, y: 500};
  this.velocity = {x: 0, y: 0};
  this.shots = [];
  this.shotTimer = SHOT_TIMER;
  this.shielding = false;
  this.shieldTimer = SHIELD_TIMER;
  this.state = 'ready';
  if(restart){
    this.shields = START_SHIELDS;
    for(var i = 0; i < this.shotsToRemove.length; i++){
      this.shotLevels[i] -= this.shotsToRemove[i];
    }
  }
  this.shotsToRemove = [0, 0, 0, 0];   
}