"use strict;"

const COUNTDOWN = 2400;
const INIT_ASTEROIDS = 10; // Initial asteroids.

/* Classes */
const Game = require('./game.js');
const Player = require('./player.js');
const Asteroid = require('./asteroid.js');



/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var background = new Image();
background.src = 'assets/background.jpg';
var player = new Player({x: canvas.width/2, y: canvas.height/2}, canvas);
var asteroids = [];
var level = 1;              
var score = 0;              
var state = 'instructions'; 
var p_key = false;          
var backgroundMusic = new Audio('assets/sounds/backgroundMusic.mp3'); 
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;
backgroundMusic.play();
var isStart = true;
var countDown = COUNTDOWN;

var gameWorldHeight = canvas.height - 50;

// Create asteroids
for(var i = 0; i < INIT_ASTEROIDS; i++){
  asteroids.push(new Asteroid(level, canvas, 3));
}



/**
 * @function masterLoop
 * Advances the game in sync with the refresh rate of the screen
 * @param {DOMHighResTimeStamp} timestamp the current time
 */
var masterLoop = function(timestamp) {
  game.loop(timestamp);
  window.requestAnimationFrame(masterLoop);
}
masterLoop(performance.now());


/**
 * Handles key press down events 
 * p = pause/unpause
 */
window.onkeydown = function(event) {
  //console.log(event.key);

  switch(event.key) {
    // p - PAUSE
    case 'p':
      event.preventDefault();
      if(!p_key){
        p_key = true;
        if(state == 'paused'){
          player.thrusting = false;
          state = 'running';
        }
        else if(state == 'running'){
          state = 'paused';
        }
      }
      break;
    // v - WARP
    case 'v':
      if(state == 'running' && player.state == 'running')
        player.warp(asteroids);
      break;
	// i - INSTRUCTIONS
	case 'i':
	  if (state != 'instructions'){
		state = 'instructions';
	  }
	  else if (state == 'instructions' && isStart){
		state = 'ready';
		isStart = false;
	  }
	  else if (state == 'instructions' && !isStart){
		state = 'running';
	  }
	  break;
    default:
      if(state == 'running' || state == 'ready'){
        player.buttonDown(event);
      }
	  else if (state == 'instructions' && isStart){
		state = 'ready';
		isStart = false;
	  }
	  else if (state == 'instructions' && !isStart){
		state = 'running';
	  }
      break;
  }
  //console.log(state);
}


/**
 * Handles key up events 
 */
window.onkeyup = function(event) {
  switch(event.key) {
    // p
    case 'p':
      event.preventDefault();
      p_key = false;
      break;
    default:
      if(state == 'running' || state == 'ready'){
        player.buttonUp(event);
      }
      break;
  }
}


/**
 * Pause game if window loses focus
 */
window.onblur = function(){
  if(state == 'running' || state == 'ready'){
    state = 'paused';
  }
}


/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {
  switch(state) {
    case 'ready': 
      countDown -= elapsedTime;
      if(countDown <= 0){
        countDown = COUNTDOWN;
        state = 'running';
        player.state = 'running';
      }
    // Intentional fallthrough
    case 'gameover':
    case 'running':
      // Update player
      player.update(elapsedTime);

      // Update asteroids
      for(var i = 0; i < asteroids.length; i++){
        asteroids[i].update(elapsedTime);
        if(asteroids[i].remove)
          asteroids.splice(i, 1);
      }

      // Check for collisions
      check_asteroid_collisions();
      check_laser_collisions();
      if(asteroids.length == 0){
        // Create new level if all asteroids destroyed
        new_level();
      }
      check_player_collisions();

      // If player is dead, check lives count and act accordingly
      if(player.state == 'dead'){
        if(player.lives > 0){
          player.restart();
          state = 'ready';
        }
        else{
          state = 'gameover';
        }
      }
      break;
    
    // Update nothing if paused
    case 'paused':
      break;
  }
}


/**
 * Check for laser on asteroid collisions
 */
function check_laser_collisions(){
  for(var i = 0; i < asteroids.length; i++){
    for(var j = 0; j < player.lasers.length; j++){
      var distSquared =
        Math.pow((player.lasers[j].position.x) - (asteroids[i].position.x + asteroids[i].radius), 2) +
        Math.pow((player.lasers[j].position.y) - (asteroids[i].position.y + asteroids[i].radius), 2);

      if(distSquared < Math.pow(asteroids[i].radius, 2) && asteroids[i].state == 'default') {
        // Laser struck asteroid
        player.lasers[j].remove = true;
        asteroids[i].struck(asteroids);
        score += 10;
        return;
      }
    }
  }
}

/**
 * Check for player on asteroid collisions
 */
function check_player_collisions(){
  if(player.state == 'running'){
    for(var i = 0; i < asteroids.length; i++){
      var distSquared =
        Math.pow((player.position.x + 10) - (asteroids[i].position.x + asteroids[i].radius), 2) +
        Math.pow((player.position.y + 10) - (asteroids[i].position.y + asteroids[i].radius), 2);

      if(asteroids[i].state != 'exploding' && distSquared < Math.pow(10 + asteroids[i].radius, 2)) {
        // Player struck asteroid
        player.explode();
        return;
      }
    }
  }
}


/**
 * Check for and deal with asteroid on asteroid collisions
 */
function check_asteroid_collisions(){
  for(var i = 0; i < asteroids.length; i++){
    for(var j = 0; j < asteroids.length; j++)
    {
      if( i != j && asteroids[i].state != 'exploding' && asteroids[j].state != 'exploding'){
        var distSquared =
          Math.pow((asteroids[i].position.x + asteroids[i].radius) - (asteroids[j].position.x + asteroids[j].radius), 2) +
          Math.pow((asteroids[i].position.y + asteroids[i].radius) - (asteroids[j].position.y + asteroids[j].radius), 2);
        // Check for collision
        if(distSquared <= Math.pow(asteroids[i].radius + asteroids[j].radius, 2)){
          if(asteroids[i].collisionCounter <= 0)
            asteroids[i].collide();
          // Calculate angle of rotation for collision
          var angle = Math.atan(Math.abs(asteroids[i].position.y - asteroids[j].position.y)/Math.abs(asteroids[i].position.x - asteroids[j].position.x));
          if(asteroids[i].position.y <= asteroids[j].position.y )
            angle *= -1;

          // Rotate asteroid velocities for calculations
          var aNewX = asteroids[i].velocity.x*Math.cos(angle) - asteroids[i].velocity.y*Math.sin(angle);
          var aNewY = asteroids[i].velocity.x*Math.sin(angle) + asteroids[i].velocity.y*Math.cos(angle);
          var bNewX = asteroids[j].velocity.x*Math.cos(angle) - asteroids[j].velocity.y*Math.sin(angle);
          var bNewY = asteroids[j].velocity.x*Math.sin(angle) + asteroids[j].velocity.y*Math.cos(angle);

          // Calculate new velocities of the two asteroids
          var aNewVel = aNewX*((asteroids[i].mass - asteroids[j].mass)/(asteroids[i].mass + asteroids[j].mass)) + bNewX*((2*asteroids[j].mass)/(asteroids[i].mass + asteroids[j].mass));
          var bNewVel = bNewX*((asteroids[j].mass - asteroids[i].mass)/(asteroids[j].mass + asteroids[i].mass)) + aNewX*((2*asteroids[i].mass)/(asteroids[j].mass + asteroids[i].mass));

          // Return to original orientation and assign new velocities
          asteroids[i].velocity.x = aNewVel*Math.cos(-angle) - aNewY*Math.sin(-angle);
          asteroids[i].velocity.y = aNewVel*Math.sin(-angle) + aNewY*Math.cos(-angle);
          asteroids[j].velocity.x = bNewVel*Math.cos(-angle) - bNewY*Math.sin(-angle);
          asteroids[j].velocity.y = bNewVel*Math.sin(-angle) + bNewY*Math.cos(-angle);

          // Update new asteroid positions to account for overlap
          var aNewXPos = asteroids[i].position.x*Math.cos(angle) - asteroids[i].position.y*Math.sin(angle);
          var aNewYPos = asteroids[i].position.x*Math.sin(angle) + asteroids[i].position.y*Math.cos(angle);
          var bNewXPos = asteroids[j].position.x*Math.cos(angle) - asteroids[j].position.y*Math.sin(angle);
          var bNewYPos = asteroids[j].position.x*Math.sin(angle) + asteroids[j].position.y*Math.cos(angle);

          var overlap = Math.ceil(((asteroids[i].radius + asteroids[j].radius) - Math.abs(asteroids[i].position.x - asteroids[j].position.x))/8);
          if(overlap > 0){
            if(asteroids[i].position.x > asteroids[j].position.x){
              aNewXPos += overlap;
              bNewXPos -= overlap;
            }
            else{
              aNewXPos -= overlap;
              bNewXPos += overlap;
            }
          }
          // Assign new asteroid positions
          asteroids[i].position.x = aNewXPos*Math.cos(-angle) - aNewYPos*Math.sin(-angle);
          asteroids[i].position.y = aNewXPos*Math.sin(-angle) + aNewYPos*Math.cos(-angle);
          asteroids[j].position.x = bNewXPos*Math.cos(-angle) - bNewYPos*Math.sin(-angle);
          asteroids[j].position.y = bNewXPos*Math.sin(-angle) + bNewYPos*Math.cos(-angle);
        }
      }
    }
  }
}

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function render(elapsedTime, ctx) {
  // Draw background
  ctx.drawImage(background, 0, 0, canvas.width, gameWorldHeight)
  // Draw asteroids
  for(var i = asteroids.length - 1; i >= 0; i--){
    asteroids[i].render(elapsedTime, ctx);
  }
  // Draw player
  player.render(elapsedTime, ctx);

  // Render HUD
	ctx.fillStyle = 'white';
	ctx.fillRect(0, gameWorldHeight, canvas.width, canvas.height);
	ctx.fillStyle = 'black';
	ctx.fillRect(2, gameWorldHeight + 2, canvas.width - 4, 46);
	ctx.globalAlpha = 1.0;
	ctx.fillStyle = 'white';
	ctx.font = "25px Impact";
	ctx.fillText("Level:  " + level, 50, canvas.height - 16);
	ctx.fillText("Score:  " + score, 200, canvas.height - 16);
	
  if(state != 'gameover'){ 
	
	for(var i = 0; i < player.lives; i++){
		ctx.globalAlpha = 0.6;
		ctx.save();
		ctx.translate(canvas.width - 50 - (30 * i), canvas.height - 24);
		ctx.beginPath();
		ctx.moveTo(0, -10);
		ctx.lineTo(-10, 10);
		ctx.lineTo(0, 0);
		ctx.lineTo(10, 10);
		ctx.closePath();
		ctx.strokeStyle = this.color;
		ctx.stroke();
		ctx.restore();
	}
  }

  // Game over screen
  if(state == 'gameover'){
	ctx.globalAlpha = .6;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.font = "60px impact";
	ctx.fillStyle = "red";
    ctx.strokeStyle = 'black';
	ctx.textAlign = "center";
	ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2); 
	ctx.strokeText("GAME OVER", canvas.width/2, canvas.height/2); 
	ctx.font = "35px impact";
	ctx.fillStyle = "black";
	ctx.fillText("Score: " + score, canvas.width/2, canvas.height/2 + 40);
  }

  // Pause
  else if(state == 'paused'){
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
	ctx.textAlign = "center";
    ctx.fillStyle = 'red';
    ctx.font = "50px impact";
    ctx.fillText("PAUSE", canvas.width/2, canvas.height/2); 
  }
  
  // Instructions
  else if(state == 'instructions'){
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
	ctx.textAlign = "center";
    ctx.fillStyle = 'red';
    ctx.font = "50px impact";
    ctx.fillText("ASTEROIDS", canvas.width/2, 100); 
	ctx.fillStyle = 'black';
	ctx.font = "25px impact";
	ctx.fillText("Movement:", canvas.width/2, 200);
	ctx.font = "20px impact";
	ctx.fillText("Use the UP arrow or 'w' to accelerate through space.", canvas.width/2, 230);
	ctx.fillText("Use the LEFT and RIGHT arrow keys or 'a' and 'd' to rotate your spaceship.", canvas.width/2, 260);
	ctx.fillText("Hit SPACE to shoot powerful lasers.", canvas.width/2, 290);
	ctx.fillText("Warp to a random location with a press of the 'v' key.", canvas.width/2, 320);
	ctx.font = "25px impact";
	ctx.fillText("Help:", canvas.width/2, 360);
	ctx.font = "20px impact";
	ctx.fillText("Press 'p' to pause/unpause the game.", canvas.width/2, 390);
	ctx.fillText("Tap 'i' to return to this screen to view instructions.", canvas.width/2, 420);
	ctx.fillText("Hit SPACE to shoot powerful lasers.", canvas.width/2, 450);
	ctx.font = "25px impact";
	ctx.fillText("OBJECTIVE:", canvas.width/2, 500);
	ctx.font = "20px impact";
	ctx.fillText("Destory and evade asteroids to score points and traverse through levels.", canvas.width/2, 530);
	ctx.fillStyle = "blue";
	ctx.font = "60px impact";
	ctx.fillText("Press any key to start!", canvas.width/2, 640);
  }

  // Ready screen
  else if(state == 'ready'){
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.font = "75px impact";
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
		ctx.textAlign = "center";
		ctx.fillText(Math.ceil(countDown/(COUNTDOWN/3)),  canvas.width/2, canvas.height/2); 
		ctx.strokeText(Math.ceil(countDown/(COUNTDOWN/3)),  canvas.width/2, canvas.height/2);
  }
}


/**
 * @function new_level
 */
function new_level(){
  level++;
  score += 100;
  player.restart();
  if(level%2) player.lives++;
  state = 'ready';
  asteroids = [];
  for(var i = 0; i < INIT_ASTEROIDS; i++){
    asteroids.push(new Asteroid(level, canvas, 3));
  }
}