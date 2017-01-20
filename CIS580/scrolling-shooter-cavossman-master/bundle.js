(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

const READY_TIMER = 2400;

/* Classes and Libraries */
const Game = require('./game');
const Vector = require('./vector');
const Camera = require('./camera');
const Player = require('./player');
const BulletPool = require('./bullet_pool');
const Enemy1 = require('./enemies/enemy1');
const Enemy2 = require('./enemies/enemy2');
const Enemy3 = require('./enemies/enemy3');
const Enemy4 = require('./enemies/enemy4');
const Enemy5 = require('./enemies/enemy5');
const Powerup = require('./powerup');


/* Global variables */
var canvas = document.getElementById('screen');
var screenSize = {width: canvas.width, height: canvas.height};
var game = new Game(canvas, update, render);
var input = {
  up: false,
  down: false,
  left: false,
  right: false,
  firing: false
}

var player = new Player();
var debugInput = true;
var levels = [];
var clouds = [];
var platforms = [];
var currLevel = 0;

levels.push(new Image());
levels.push(new Image());
levels.push(new Image());
levels[0].src = 'assets/levels/ground.png';
levels[1].src = 'assets/levels/ground.png';
levels[2].src = 'assets/levels/ground.png';

clouds.push(new Image());
clouds.push(new Image());
clouds.push(new Image());
clouds[0].src = 'assets/levels/clouds.png';
clouds[1].src = 'assets/levels/clouds.png';
clouds[2].src = 'assets/levels/clouds.png';

platforms.push(new Image());
platforms.push(new Image());
platforms.push(new Image());
platforms[0].src = 'assets/levels/platforms.png';
platforms[1].src = 'assets/levels/platforms.png';
platforms[2].src = 'assets/levels/platforms.png';

var title = new Image();
title.src = 'assets/title.jpg';

var levelSize = {width: 810, height: 4320};
var levelTop = levelSize.height - screenSize.height;
var cloudTop = levelSize.height - screenSize.height;
var platTop = levelSize.height - screenSize.height;
var waitingEnemies = [];
var enemies = [];
var waitingPowerups = [];
var powerups = [];
var enemyShots = [];
var enemyTimer = 0;
var paused = false;
var state = 'start';
var countDown = READY_TIMER;
var enemiesDestroyed = 0;
var levelDestroyed = 0;
var score = 0;
var levelScore = 0;
var explosions = [];
var explosion_colors = ['#696359', '#F02E2E', '#FFAF2E'];
buildLevel();


/**
 * @function onkeydown
 * Handles keydown events
 */
window.onkeydown = function(event) {
  if(state == 'summary'){
    currLevel++;
    restart(false);
  }
  else if(state == 'dead'){
    restart(true);
  }
  /*else if (state == 'instructions'){
	state == 'ready';
	player.state = 'running';
  }*/

  switch(event.key) {
    case "ArrowUp":
    case "w":
      event.preventDefault();
      if(state == 'running' || state == 'ready'){
        input.up = true;
        input.down = false;
      }
      break;
    case "ArrowDown":
    case "s":
      event.preventDefault();
      if(state == 'running' || state == 'ready'){
        input.down = true;
        input.up = false;
      }    
      break;
    case "ArrowLeft":
    case "a":
      event.preventDefault();
      if(state == 'running' || state == 'ready'){
        input.left = true;
        input.right = false;
      }    
      break;
    case "ArrowRight":
    case "d":
      event.preventDefault();
      if(state == 'running' || state == 'ready'){
        input.right = true;
        input.left = false;
      }    
      break;
    case " ":
      event.preventDefault();
      if(state == 'running'){
        input.firing = true;
      }
      break;
    case "p":
      event.preventDefault();
      if(!paused){
        paused = true;
        if(state == 'running'){
          state = 'paused';
        }
        else if(state == 'paused'){
          state = 'running';
          input = {
          up: false,
          down: false,
          left: false,
          right: false,
          firing: false
          }          
        }
      }
      break;      
    default:
      if(debugInput){
        debugInput = false;
      }
      break;
  }
}

/**
 * @function onkeyup
 * Handles keydown events
 */
window.onkeyup = function(event) {
  switch(event.key) {
    case "ArrowUp":
    case "w":
      input.up = false;
      event.preventDefault();
      break;
    case "ArrowDown":
    case "s":
      input.down = false;
      event.preventDefault();
      break;
    case "ArrowLeft":
    case "a":
      input.left = false;
      event.preventDefault();
      break;
    case "ArrowRight":
    case "d":
      input.right = false;
      event.preventDefault();
      break;
    case " ":
      input.firing = false;
      event.preventDefault();
      break;
    case "p":
      event.preventDefault();
      paused = false;
      break;
    default:
      debugInput = true;
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
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {
  var deferred_kills = [];
	for ( var i = 0; i < explosions.length; i++ ) {
		explosions[i].update();
		if(explosions[i]._killed)
			deferred_kills.unshift(i);
	}
	
	for ( var i = 0; i < deferred_kills.length; i++ ) {
		explosions.splice(i, 1);
	}

  switch(state){
	case 'start':
	  countDown -= elapsedTime / 2;
	  if(countDown <= 0){
        countDown = READY_TIMER;
        state = 'ready';
        player.state = 'ready';
      }
	  break;
	  
	// Broke in canvas instructions.
	//case 'instructions':
	//  break;
	
    case 'ready':
      // update the player
      player.update(elapsedTime, input);

      countDown -= elapsedTime;
      if(countDown <= 0){
        countDown = READY_TIMER;
        state = 'running';
        player.state = 'running';
      }
      break;

    case 'running':
      enemyTimer++;

      while(waitingEnemies.length){
        if(waitingEnemies[0].startTime <= enemyTimer){
          enemies.push(waitingEnemies[0]);
          waitingEnemies.splice(0, 1);
        }
        else break;
      }

      if(waitingPowerups.length && enemyTimer >= waitingPowerups[0].startTime){
        powerups.push(waitingPowerups[0]);
        waitingPowerups.splice(0, 1);
      }

      levelTop -= 1;
      cloudTop -= 2;
      platTop -= 3;
      if(levelTop <= 0) levelTop = levelSize.height;
      if(cloudTop <= 0) cloudTop = levelSize.height;
      if(platTop <= 0) platTop = levelSize.height;

      // update the player
      player.update(elapsedTime, input);

      // Update enemies
      var markedForRemoval = [];
      enemies.forEach(function(enemy, i){
        enemy.update(elapsedTime, player.position);
        if(enemy.remove)
          markedForRemoval.unshift(i);
      });
      markedForRemoval.forEach(function(index){
        enemies.splice(index, 1);
      });

      // Update powerups
      var markedForRemoval = [];
      powerups.forEach(function(powerup, i){
        powerup.update(elapsedTime);
        if(powerup.remove)
          markedForRemoval.unshift(i);
      });
      markedForRemoval.forEach(function(index){
        powerups.splice(index, 1);
      });      

      // Update enemy shots
      var markedForRemoval = [];
      enemyShots.forEach(function(shot, i){
        shot.update(elapsedTime);
        if(shot.remove)
          markedForRemoval.unshift(i);
      });
      markedForRemoval.forEach(function(index){
        enemyShots.splice(index, 1);
      });

      if(player.state == 'running'){
        check_player_hit();
        check_enemies_hit();
        check_powerups();
      }

      if(player.state == 'dead'){
        if(player.lives > 0){
          state = 'dead';
        }
        else{
          state = 'gameover';
        }
      }

      if(waitingEnemies.length == 0 && enemies.length == 0){
        player.state = 'finished';
        state = 'win';
        enemiesDestroyed += levelDestroyed;
        score += levelScore;
      }
      break;
    
    case 'win':
      // update the player
      player.update(elapsedTime, input);
      if(player.state == 'offscreen'){
        if(currLevel < 2) state = 'summary';
        else state = 'win';
      }
      // Update enemy shots
      var markedForRemoval = [];
      enemyShots.forEach(function(shot, i){
        shot.update(elapsedTime);
        if(shot.remove)
          markedForRemoval.unshift(i);
      });
      markedForRemoval.forEach(function(index){
        enemyShots.splice(index, 1);
      });      
      break;
    case 'win':
    case 'paused':
    case 'dead':
    case 'gameover':
    case 'summary':
  }
}


function check_powerups(){
  for(var i = 0; i < powerups.length; i++){
    var playerX = player.position.x + 23;
    var playerY = player.position.y + 27;
    var powerupX = powerups[i].position.x + 5;
    var powerupY = powerups[i].position.y + 5;

    if((Math.pow((player.position.y + 27) - (powerups[i].position.y + 21), 2) + 
        Math.pow((player.position.x + 23) - (powerups[i].position.x + 20), 2) <= 
        Math.pow(45, 2))){
      player.pickupPowerup(powerups[i].type);
      powerups[i].remove = true;;
    }
  }
}


function check_enemies_hit(){
  for(var j = 0; j < enemies.length; j++){
    var enemy = enemies[j];
    for(var i = 0; i < player.shots.length; i++){
      var shot = player.shots[i];

      if(!(shot.position.x + shot.draw_width/2 + shot.width/2 < enemy.position.x ||
        shot.position.x + shot.draw_width/2 - shot.width/2> enemy.position.x + enemy.width ||
        shot.position.y + shot.draw_height/2 - shot.height/2 > enemy.position.y + enemy.height - 15||
        shot.position.y + shot.draw_height/2 + shot.height/2 < enemy.position.y))
      {
          player.shots[i].remove = true;
          enemy.struck();
          levelDestroyed++;
          levelScore += 14;
      }
    }
    if(!(player.position.x + player.draw_width/2 + player.width/2 < enemy.position.x ||
      player.position.x + player.draw_width/2 - player.width/2> enemy.position.x + enemy.width ||
      player.position.y + player.draw_height/2 - player.height/2 > enemy.position.y + enemy.height - 15||
      player.position.y + player.draw_height/2 + player.height/2 < enemy.position.y))
    {
        player.struck(5);
        enemy.struck();
    }
  }
}

function check_player_hit(){
  for(var i = 0; i < enemyShots.length; i++){
    var playerX = player.position.x + 23;
    var playerY = player.position.y + 27;
    var shotX = enemyShots[i].position.x + 5;
    var shotY = enemyShots[i].position.y + 5;

    if(!(shotX + 5 < playerX - 25||
       shotX - 5 > playerX + 25 ||
       shotY + 5 < playerY - 25 ||
       shotY - 5 > playerY + 25))
    {enemyShots[i].remove = true;;
        player.struck(2);
    }
  }
}


function restart(died){
    levelScore = 0;
    levelDestroyed = 0;
    levelTop = levelSize.height - screenSize.height;
    cloudTop = levelSize.height - screenSize.height;
    platTop = levelSize.height - screenSize.height;
    enemyShots = [];
    enemyTimer = 0;
    player.restart(died);
    buildLevel();
    state = 'ready';
}


/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function render(elapsedTime, ctx) {

  ctx.fillStyle = "white"
  ctx.fillRect(0, 0, 1024, screenSize.height);


  // GROUND
  if(levelTop < levelSize.height - screenSize.height){  
    ctx.drawImage(levels[currLevel], 
                  0, levelTop, levelSize.width, screenSize.height,
                  0, 0, levelSize.width, screenSize.height
                  );
  }
  else{
    ctx.drawImage(levels[currLevel], 
                  0, levelTop, levelSize.width, screenSize.height,
                  0, 0, levelSize.width, screenSize.height 
                  );
    ctx.drawImage(levels[currLevel], 
                  0, 0, levelSize.width, screenSize.height,
                  0, (levelSize.height - levelTop), levelSize.width, screenSize.height 
                  );
  }


  // CLOUDS
  ctx.globalAlpha = 0.7;
  if(cloudTop < levelSize.height - screenSize.height){  
    ctx.drawImage(clouds[currLevel], 
                  0, cloudTop, levelSize.width, screenSize.height,
                  0, 0, levelSize.width, screenSize.height
                  );
  }
  else{
    ctx.drawImage(clouds[currLevel], 
                  0, cloudTop, levelSize.width, screenSize.height,
                  0, 0, levelSize.width, screenSize.height 
                  );
    ctx.drawImage(clouds[currLevel], 
                  0, 0, levelSize.width, screenSize.height,
                  0, (levelSize.height - cloudTop), levelSize.width, screenSize.height 
                  );
  }
  ctx.globalAlpha = 1;


  // PLATFORMS
  if(platTop < levelSize.height - screenSize.height){  
    ctx.drawImage(platforms[currLevel], 
                  0, platTop, levelSize.width, screenSize.height,
                  0, 0, levelSize.width, screenSize.height
                  );
  }
  else{
    ctx.drawImage(platforms[currLevel], 
                  0, platTop, levelSize.width, screenSize.height,
                  0, 0, levelSize.width, screenSize.height 
                  );
    ctx.drawImage(platforms[currLevel], 
                  0, 0, levelSize.width, screenSize.height,
                  0, (levelSize.height - platTop), levelSize.width, screenSize.height 
                  );
  }


  ctx.font = "30px Arial";
  ctx.strokeText(enemyTimer, 840, 600);
  ctx.strokeText(player.shields, 840, 550);
  ctx.stroke();

  // Render enemies
  for(var i = 0; i < enemies.length; i++){
    enemies[i].render(elapsedTime, ctx);
  }

	// Render explosions
	for ( var i = 0; i < explosions.length; i++ ) {
		explosions[i].render(elapsedTime, ctx);
	}

  // Render powerups
  for(var i = 0; i < powerups.length; i++){
    powerups[i].render(elapsedTime, ctx);
  }

  // Render enemy shots
  for(var i = 0; i < enemyShots.length; i++){
    enemyShots[i].render(elapsedTime, ctx);
  }

  // Render the player
  player.render(elapsedTime, ctx);

  // Render the GUI 
  renderGUI(elapsedTime, ctx);

  switch(state){
	case 'start':
	  ctx.drawImage(title, 0, 0, 512, 384, 0, 0, canvas.width, canvas.height);
	  break;
	case 'instructions':
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = "center";
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.font = "50px impact";
      ctx.fillText("INSTRUCTIONS", levelSize.width/2, canvas.height/2); 
      ctx.strokeText("INSTRUCTIONS", levelSize.width/2, canvas.height/2); 
    case 'ready':
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, levelSize.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.font = "75px impact";
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.textAlign = "center";
      ctx.fillText(Math.ceil(countDown/(READY_TIMER/3)),  levelSize.width/2, canvas.height/2); 
      ctx.strokeText(Math.ceil(countDown/(READY_TIMER/3)),  levelSize.width/2, canvas.height/2);
      break;
    case 'running':
      break;
    case 'paused':
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, levelSize.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.textAlign = "center";
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.font = "50px impact";
      ctx.fillText("PAUSED", levelSize.width/2, canvas.height/2); 
      ctx.strokeText("PAUSED", levelSize.width/2, canvas.height/2); 
      break;
    case 'dead':
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, levelSize.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.font = "60px Georgia, serif";
      ctx.fillStyle = "red";
      ctx.strokeStyle = "black";
      ctx.textAlign = "center";
      ctx.fillText("YOU DIED", levelSize.width/2, canvas.height/2); 
      ctx.strokeText("YOU DIED", levelSize.width/2, canvas.height/2); 
      ctx.font = "35px impact";
      ctx.fillStyle = "black";
      ctx.fillText("Lives remaining: " + player.lives, levelSize.width/2, canvas.height/2 + 40);
      ctx.fillText("Press any key to continue", levelSize.width/2, canvas.height/2 + 80);
      break;
    case 'gameover':
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, levelSize.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.font = "60px Georgia, serif";
      ctx.fillStyle = "red";
      ctx.strokeStyle = "black";
      ctx.textAlign = "center";
      ctx.fillText("YOU DIED", levelSize.width/2, canvas.height/2 - 75); 
      ctx.strokeText("YOU DIED", levelSize.width/2, canvas.height/2 - 75);       
      ctx.font = "40px impact";
      ctx.fillText("GAME OVER", levelSize.width/2, canvas.height/2); 
      ctx.strokeText("GAME OVER", levelSize.width/2, canvas.height/2); 
      ctx.font = "35px impact";
      ctx.fillStyle = "black";
      ctx.fillText("Final Score: " + score, levelSize.width/2, canvas.height/2 + 40);
      ctx.fillText("Total Enemies Destroyed: " + enemiesDestroyed, levelSize.width/2, canvas.height/2 + 80);
      break;
    case 'win':
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, levelSize.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.font = "60px impact";
      ctx.fillStyle = "white";
      ctx.strokeStyle = 'black';
      ctx.textAlign = "center";
      ctx.fillText("CONGRATULATIONS!", levelSize.width/2, canvas.height/2); 
      ctx.strokeText("CONGRATULATIONS!", levelSize.width/2, canvas.height/2); 
      ctx.font = "35px impact";
      ctx.fillStyle = "black";
      ctx.fillText("Final Score: " + score, levelSize.width/2, canvas.height/2 + 40);
      ctx.fillText("Total Enemies Destroyed: " + enemiesDestroyed, levelSize.width/2, canvas.height/2 + 80);
      break;
    case 'summary':
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, levelSize.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.font = "60px impact";
      ctx.fillStyle = "white";
      ctx.strokeStyle = 'black';
      ctx.textAlign = "center";
      ctx.fillText("LEVEL COMPLETE!", levelSize.width/2, canvas.height/2); 
      ctx.strokeText("LEVEL COMPLETE!", levelSize.width/2, canvas.height/2); 
      ctx.font = "35px impact";
      ctx.fillStyle = "black";
      ctx.fillText("Level Score: " + levelScore, levelSize.width/2, canvas.height/2 + 40);
      ctx.fillText("Enemies Destroyed: " + levelDestroyed, levelSize.width/2, canvas.height/2 + 80);
      ctx.fillText("Press any key to continue", levelSize.width/2, canvas.height/2 + 180);
      break;
  }
}


function buildLevel(){
  // POWERUPS
  waitingPowerups = [];
  powerups = [];
  switch(currLevel){
    case 0:
      waitingPowerups.push(new Powerup({x: 400, y: -50}, 1000, 1, explosions));
      waitingPowerups.push(new Powerup({x: 600, y: -50}, 2000, 4, explosions));
      waitingPowerups.push(new Powerup({x: 200, y: -50}, 3000, 3, explosions));
      break;

    case 1:
      waitingPowerups.push(new Powerup({x: 400, y: -50}, 1000, 4, explosions));
      waitingPowerups.push(new Powerup({x: 600, y: -50}, 2000, 3, explosions));
      waitingPowerups.push(new Powerup({x: 200, y: -50}, 3000, 1, explosions));
      break;

    case 2:
      waitingPowerups.push(new Powerup({x: 400, y: -50}, 1000, 2, explosions));
      waitingPowerups.push(new Powerup({x: 600, y: -50}, 2000, 4, explosions));
      waitingPowerups.push(new Powerup({x: 200, y: -50}, 3000, 1, explosions));    
      break;

    default:
      break;
  }

  waitingEnemies = [];
  enemies = [];
  
  // ENEMY 1
  if(currLevel >= 1)
  for(var k = 0; k < 4; k++){
    for(var i = 0; i < 5; i++){
      for(var j =0; j < 3; j++){
        waitingEnemies.push(new Enemy1({x: 200 + 100*i, y: -50}, 300 + 100*i + 10*j + 1000*k, currLevel, enemyShots, explosions));
      }
    }
  }

  // ENEMY 2
  var multiplier = 1440;
  for(var i = 0; i < 3; i++){
    waitingEnemies.push(new Enemy2({x: 650, y: -100}, multiplier*i + 115, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy2({x: 480, y: -50}, multiplier*i + 170, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy2({x: 100, y: -50}, multiplier*i + 200, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy2({x: 400, y: -50}, multiplier*i + 390, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy2({x: 700, y: -50}, multiplier*i + 430, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy2({x: 50, y: -50}, multiplier*i + 590, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy2({x: 300, y: -50}, multiplier*i + 590, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy2({x: 150, y: -50}, multiplier*i + 700, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy2({x: 650, y: -50}, multiplier*i + 750, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy2({x: 270, y: -50}, multiplier*i + 800, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy2({x: 700, y: -50}, multiplier*i + 850, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy2({x: 700, y: -50}, multiplier*i + 950, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy2({x: 50, y: -50}, multiplier*i + 1000, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy2({x: 200, y: -50}, multiplier*i + 1050, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy2({x: 150, y: -50}, multiplier*i + 1100, currLevel, enemyShots, explosions))
  }

  // ENEMY 3
  var direction = 1;
  for(var i = 0; i < 8; i++){
    waitingEnemies.push(new Enemy3({x: (405 - 405*direction) - (12 + 12*direction) , y: 100 + i*60}, 100, i%2+1, currLevel, enemyShots, explosions))
    direction *= -1;
  }
  for(var i = 0; i < 8; i++){
    waitingEnemies.push(new Enemy3({x: (405 - 405*direction) - (12 + 12*direction) , y: 100 + i*60}, 2800, i%2+1, currLevel, enemyShots, explosions))
    direction *= -1;
  }
  for(var i = 0; i < 8; i++){
    waitingEnemies.push(new Enemy3({x: (405 - 405*direction) - (12 + 12*direction) , y: 100 + i*60}, 3800, i%2+1, currLevel, enemyShots, explosions))
    direction *= -1;
  }    
  for(var i = 0; i < 6; i++){
    waitingEnemies.push(new Enemy3({x: 60 + 130*i, y: -50}, 900 + 20*i, 0, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy3({x: 400, y: -50}, 1700 + 50*i, 0, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy3({x: 400, y: -50}, 2000 + 50*i, 0, currLevel, enemyShots, explosions))
    waitingEnemies.push(new Enemy3({x: 400, y: -50}, 3000 + 50*i, 0, currLevel, enemyShots, explosions))
  }  

  // ENEMY 4
  if(currLevel >= 2)
  {
    for(var i = 0; i < 5; i++){
      waitingEnemies.push(new Enemy4({x: -50, y: -50}, 600 +  20*i, 1, currLevel, enemyShots, explosions))
    }
    for(var j = 0; j < 4; j++){
      for(var i = 0; i < 5; i++){
        waitingEnemies.push(new Enemy4({x: -50, y: -50}, 1000 + 1000*j +  20*i, 1, currLevel, enemyShots, explosions))
      }
    }
    for(var j = 0; j < 3; j++){
      for(var i = 0; i < 5; i++){
        waitingEnemies.push(new Enemy4({x: 860, y: -50}, 1100 +  1100*j +  20*i, -1, currLevel, enemyShots, explosions))
      }  
    }
  }  


  // ENEMY 5
  if(currLevel >= 2)
  {  
    for(var i = 0; i < 5; i++){
      waitingEnemies.push(new Enemy5({x: 10, y: -50}, 1100 + 30*i, 1, currLevel, enemyShots, explosions))
    }
    for(var i = 0; i < 5; i++){
      waitingEnemies.push(new Enemy5({x: 800, y: -50}, 2800 + 30*i, -1, currLevel, enemyShots, explosions))
    }  
  }

  waitingEnemies.sort(function(a, b){
    return a.startTime - b.startTime;
  });
}

/**
  * @function renderGUI
  * Renders the game's GUI
  * @param {DOMHighResTimeStamp} elapsedTime
  * @param {CanvasRenderingContext2D} ctx
  */
function renderGUI(elapsedTime, ctx) {
	
  // GUI occasionally off intended position on startup...
  ctx.fillStyle = "black";
  ctx.fillRect(810, 0, 214, 786);
  ctx.fillStyle = "white";
  ctx.fillRect(815, 5, 204, 776);
  
  ctx.fillStyle = "black";
  ctx.fillRect(820, 300, 194, 50);
  
  // SHIELDS
  if(player.shields > 0){
    if(player.shields > 50) ctx.fillStyle = 'green';
	else if(player.shields > 20) ctx.fillStyle = 'yellow';
    else ctx.fillStyle = 'red';
	if (player.shields > 0){
	  ctx.fillRect(822, 302, (player.shields * 1.94) - 4, 46);
	}
  }
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.font = "40px impact";
  ctx.fillText("SHIELDS", 915, 280); 
  ctx.strokeText("SHIELDS", 915, 280);
  
  // LIVES
  ctx.font = "30px impact";
  ctx.fillText("LIVES: ", 865, 750); 
  ctx.strokeText("LIVES: ", 865, 750);
  for(var i = 0; i < player.lives; i++){
    ctx.drawImage(player.img, 42, 0, 21, 27, 910 + 35 * i, 720, 27, 35);
  }
  
  // LEVEL 
  ctx.font = "40px impact";
  ctx.fillText("Level: " + (currLevel + 1), 875, 50); 
  ctx.strokeText("Level: " + (currLevel + 1), 875, 50);
  
  // SCORE - could improve.
  ctx.fillText("Score: " + levelScore, 900, 100); 
  ctx.strokeText("Score: " + levelScore, 900, 100);
 
}

},{"./bullet_pool":2,"./camera":3,"./enemies/enemy1":4,"./enemies/enemy2":5,"./enemies/enemy3":6,"./enemies/enemy4":7,"./enemies/enemy5":8,"./game":10,"./player":12,"./powerup":13,"./vector":20}],2:[function(require,module,exports){
"use strict";

/**
 * @module BulletPool
 * A class for managing bullets in-game
 * We use a Float32Array to hold our bullet info,
 * as this creates a single memory buffer we can
 * iterate over, minimizing cache misses.
 * Values stored are: positionX, positionY, velocityX,
 * velocityY in that order.
 */
module.exports = exports = BulletPool;

/**
 * @constructor BulletPool
 * Creates a BulletPool of the specified size
 * @param {uint} size the maximum number of bullets to exits concurrently
 */
function BulletPool(maxSize) {
  this.pool = new Float32Array(4 * maxSize);
  this.end = 0;
  this.max = maxSize;
}

/**
 * @function add
 * Adds a new bullet to the end of the BulletPool.
 * If there is no room left, no bullet is created.
 * @param {Vector} position where the bullet begins
 * @param {Vector} velocity the bullet's velocity
*/
BulletPool.prototype.add = function(position, velocity) {
  if(this.end < this.max) {
    this.pool[4*this.end] = position.x;
    this.pool[4*this.end+1] = position.y;
    this.pool[4*this.end+2] = velocity.x;
    this.pool[4*this.end+3] = velocity.y;
    this.end++;
  }
}

/**
 * @function update
 * Updates the bullet using its stored velocity, and
 * calls the callback function passing the transformed
 * bullet.  If the callback returns true, the bullet is
 * removed from the pool.
 * Removed bullets are replaced with the last bullet's values
 * and the size of the bullet array is reduced, keeping
 * all live bullets at the front of the array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {function} callback called with the bullet's position,
 * if the return value is true, the bullet is removed from the pool
 */
BulletPool.prototype.update = function(elapsedTime, callback) {
  for(var i = 0; i < this.end; i++){
    // Move the bullet
    this.pool[4*i] += this.pool[4*i+2];
    this.pool[4*i+1] += this.pool[4*i+3];
    // If a callback was supplied, call it
    if(callback && callback({
      x: this.pool[4*i],
      y: this.pool[4*i+1]
    })) {
      // Swap the current and last bullet if we
      // need to remove the current bullet
      this.pool[4*i] = this.pool[4*(this.end-1)];
      this.pool[4*i+1] = this.pool[4*(this.end-1)+1];
      this.pool[4*i+2] = this.pool[4*(this.end-1)+2];
      this.pool[4*i+3] = this.pool[4*(this.end-1)+3];
      // Reduce the total number of bullets by 1
      this.end--;
      // Reduce our iterator by 1 so that we update the
      // freshly swapped bullet.
      i--;
    }
  }
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
BulletPool.prototype.render = function(elapsedTime, ctx) {
  // Render the bullets as a single path
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "black";
  for(var i = 0; i < this.end; i++) {
    ctx.moveTo(this.pool[4*i], this.pool[4*i+1]);
    ctx.arc(this.pool[4*i], this.pool[4*i+1], 2, 0, 2*Math.PI);
  }
  ctx.fill();
  ctx.restore();
}

},{}],3:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Vector = require('./vector');

/**
 * @module Camera
 * A class representing a simple camera
 */
module.exports = exports = Camera;

/**
 * @constructor Camera
 * Creates a camera
 * @param {Rect} screen the bounds of the screen
 */
function Camera(screen) {
  this.x = 0;
  this.y = 0;
  this.width = screen.width;
  this.height = screen.height;
}

/**
 * @function update
 * Updates the camera based on the supplied target
 * @param {Vector} target what the camera is looking at
 */
Camera.prototype.update = function(target) {
  // TODO: Align camera with player
}

/**
 * @function onscreen
 * Determines if an object is within the camera's gaze
 * @param {Vector} target a point in the world
 * @return true if target is on-screen, false if not
 */
Camera.prototype.onScreen = function(target) {
  return (
     target.x > this.x &&
     target.x < this.x + this.width &&
     target.y > this.y &&
     target.y < this.y + this.height
   );
}

/**
 * @function toScreenCoordinates
 * Translates world coordinates into screen coordinates
 * @param {Vector} worldCoordinates
 * @return the tranformed coordinates
 */
Camera.prototype.toScreenCoordinates = function(worldCoordinates) {
  return Vector.subtract(worldCoordinates, this);
}

/**
 * @function toWorldCoordinates
 * Translates screen coordinates into world coordinates
 * @param {Vector} screenCoordinates
 * @return the tranformed coordinates
 */
Camera.prototype.toWorldCoordinates = function(screenCoordinates) {
  return Vector.add(screenCoordinates, this);
}

},{"./vector":20}],4:[function(require,module,exports){
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

},{"../explosion":9,"../shots/enemy_shot":14}],5:[function(require,module,exports){
"use strict";

const MOVEMENT = 3;
const MS_PER_FRAME = 1000/5;

const EnemyShot = require('../shots/enemy_shot');
const Explosion = require('../explosion');

var explosion_colors = ['105,99,89,', '240,46,46,', '255,175,46,'];

/**
 * @module exports the Enemy2 class
 */
module.exports = exports = Enemy2;


/**
 * @constructor Enemy2
 * Creates a new enemy2 object
 * @param {Postition} position object specifying an x and y
 */
function Enemy2(position, startTime, level, enemyShots, explosions) {
    this.level = level;
    this.startTime = startTime;
    this.worldWidth = 850;
    this.worldHeight = 800;
    this.position = {
        x: position.x,
        y: position.y
    };
    this.image = new Image();
    this.image.src = 'assets/enemies/enemy_2.png';
    this.remove = false;
    this.frame = 0;
    this.frameTimer = MS_PER_FRAME;
    this.imgWidth = 24;
    this.imgHeight = 28;
    this.width = 2.25*this.imgWidth;
    this.height = 2.25*this.imgHeight;
    this.state = 'default';
    this.enemyShots = enemyShots;
    this.explosions = explosions;
    this.shotWait = 1500 - 150*this.level;
    this.shotTimer = this.shotWait;
    this.exploded = false;
}


/**
 * @function updates the enemy2 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Enemy2.prototype.update = function(time, playerPos) {
    if(this.state == 'firing'){
        this.frameTimer -= time;
        if(this.frameTimer <= 0){
            this.frameTimer = MS_PER_FRAME;
            this.frame++;
            if(this.frame >= 3){
                this.enemyShots.push(new EnemyShot({x: this.position.x - 8,
                                                    y: this.position.y - 1},
                                                    playerPos));
                this.state = 'default';
                this.frame = 0;
            }
        }
    }

    this.shotTimer -= time;
    if(this.shotTimer <= 0){
        this.state = 'firing';
        this.shotTimer = this.shotWait;
    }
	
    this.position.y += MOVEMENT;

    if(this.position.x < -50 || this.position.x > this.worldWidth + 50 ||
        this.position.y < -50 || this.position.y > this.worldHeight + 50){
        this.remove = true;;
    }
}

/**
 * @function renders the enemy2 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Enemy2.prototype.struck = function() {
    this.explosions.push(new Explosion({x: this.position.x + this.imgWidth,
                                        y: this.position.y + this.imgHeight}, 
                                        explosion_colors));
    this.remove = true;                                        
}

/**
 * @function renders the enemy2 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Enemy2.prototype.render = function(time, ctx) {
    ctx.drawImage(this.image,
                  this.imgWidth*this.frame, 0, this.imgWidth, this.imgHeight,
                  this.position.x, this.position.y, this.width, this.height
                  );  
}

},{"../explosion":9,"../shots/enemy_shot":14}],6:[function(require,module,exports){
"use strict";

const SPEED = 4;

const EnemyShot = require('../shots/enemy_shot');
const Explosion = require('../explosion');

var explosion_colors = ['105,99,89,', '240,46,46,', '255,175,46,'];
/**
 * @module exports the Enemy3 class
 */
module.exports = exports = Enemy3;


/**
 * @constructor Enemy3
 * Creates a new enemy3 object
 * @param {Postition} position object specifying an x and y
 */
function Enemy3(position, startTime, type, level, enemyShots, explosions) {
    this.level = level;    
    this.startTime = startTime;
    this.worldWidth = 850;
    this.worldHeight = 800;
    this.type = type; 
    this.position = {
        x: position.x,
        y: position.y
    };
    this.image = new Image();
    this.image.src = 'assets/enemies/enemy_3.png';
    this.remove = false;
    this.imgWidth = 24;
    this.imgHeight = 26;
    this.width = 2*this.imgWidth;
    this.height = 2*this.imgHeight;
    this.enemyShots = enemyShots;
    this.explosions = explosions;    
    this.shotWait = 1500 - 150*this.level;
    this.shotTimer = this.shotWait;
}


/**
 * @function updates the enemy3 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Enemy3.prototype.update = function(time, playerPos) {
    // Apply velocity
    switch(this.type){
        case 0:
            this.position.y += SPEED;
            break;
        case 1:
            this.position.x += SPEED;
            break;
        case 2:
            this.position.x -= SPEED;
            break;
    }

    
    if(this.position.x < -50 || this.position.x > this.worldWidth + 50 ||
        this.position.y < -50 || this.position.y > this.worldHeight + 50){
        this.remove = true;;
    }
}

/**
 * @function
 */
Enemy3.prototype.struck = function() {
    this.explosions.push(new Explosion({x: this.position.x + this.imgWidth,
                                        y: this.position.y + this.imgHeight}, 
                                        explosion_colors));
    this.remove = true;                                        
}

/**
 * @function renders the enemy3 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Enemy3.prototype.render = function(time, ctx) {
    ctx.drawImage(this.image,
                  this.imgWidth*this.type, 0, this.imgWidth, this.imgHeight,
                  this.position.x, this.position.y, this.width, this.height
                  );  
}

},{"../explosion":9,"../shots/enemy_shot":14}],7:[function(require,module,exports){
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

},{"../explosion":9,"../shots/enemy_shot":14}],8:[function(require,module,exports){
"use strict";

const MS_PER_FRAME = 1000/16;
const DIST_TO_SWITCH = 150;

const EnemyShot = require('../shots/enemy_shot');
const Explosion = require('../explosion');

var explosion_colors = ['105,99,89,', '240,46,46,', '255,175,46,'];
/**
 * @module exports the Enemy5 class
 */
module.exports = exports = Enemy5;


/**
 * @constructor Enemy5
 * Creates a new enemy5 object
 * @param {Postition} position object specifying an x and y
 */
function Enemy5(position, startTime, direction, level, enemyShots, explosions) {
    this.level = level;
    this.startTime = startTime;
    this.worldWidth = 850;
    this.worldHeight = 800;
    this.direction = direction; 
    this.position = {
        x: position.x,
        y: position.y
    };
    this.velocity = {
        x: 0,
        y: 5
    }
    this.image = new Image();
    this.image.src = 'assets/enemies/enemy_5.png';
    this.distanceTravelled = 0;
    this.remove = false;
    this.frame = 0;
    this.frameTimer = MS_PER_FRAME;
    this.imgWidth = 21;
    this.imgHeight = 21;
    this.width = 2*this.imgWidth;
    this.height = 2*this.imgHeight;
    this.shotWait = 1500 - 150*this.level;
    this.shotTimer = this.shotWait;
    this.enemyShots = enemyShots;
    this.explosions = explosions;    
}


/**
 * @function updates the enemy5 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Enemy5.prototype.update = function(time, playerPos) {
    // Update frames
    this.frameTimer -= time;
    if(this.frameTimer <= 0){
        this.frameTimer = MS_PER_FRAME;
        this.frame++;
        if(this.frame >= 8){
            this.frame = 0;
        }
    }

    this.distanceTravelled += 3;
    if(this.distanceTravelled >= DIST_TO_SWITCH){
        var temp = this.velocity.y;
        this.velocity.y = this.velocity.x;
        this.velocity.x = temp;
        this.distanceTravelled = 0;
    }

    // Apply velocity
    this.position.y += this.velocity.y;
    this.position.x += this.velocity.x * this.direction;

    if(this.position.x < -50 || this.position.x > this.worldWidth + 50 ||
       this.position.y < -50 || this.position.y > this.worldHeight + 50){
        this.remove = true;;
    }
}

/**
 * @function
 */
Enemy5.prototype.struck = function() {
    this.explosions.push(new Explosion({x: this.position.x + this.imgWidth,
                                        y: this.position.y + this.imgHeight}, 
                                        explosion_colors));
    this.remove = true;                                        
}

/**
 * @function renders the enemy5 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Enemy5.prototype.render = function(time, ctx) {
    ctx.drawImage(this.image,
                  this.imgWidth*this.frame, 0, this.imgWidth, this.imgHeight,
                  this.position.x, this.position.y, this.width, this.height
                  );  
}

},{"../explosion":9,"../shots/enemy_shot":14}],9:[function(require,module,exports){
"use strict";

var fHz = 1000/60; // The update frequency

const Particle = require('./particle');

/**
 * @module exports the Explosion class
 */
module.exports = exports = Explosion;


/**
 * @constructor Explosion
 * Creates a new explosion object
 * @param {Postition} position object specifying an x and y
 */
function Explosion(position, colors) {
	this.particles = [];    // List of particles in the explosion
	this._killed = false;   // flag indicating if the explosion is done

    for ( var i = 0; i < colors.length; i++ ) {
        this.createExplosion({x: position.x, y: position.y}, colors[i]);
    }
}

/**
 * @function 
 */
Explosion.prototype.createExplosion = function(position, color) {
    // Number of particles to use
    var numParticles = 12;

    // Particle size parameters
    // Controls the size of the particle.
    var minSize = 5;
    var maxSize = 20;

    // Particle speed parameters
    // Controls how quickly the particle
    // speeds outwards from the blast center.
    var minSpeed = 60.0;
    var maxSpeed = 300.0;

    // Scaling speed parameters
    // Controls how quickly the particle shrinks.
    var minScaleSpeed = 1.0;
    var maxScaleSpeed = 2.0;

    // Uniformly distribute the particles in a circle
    for ( var angle=0; angle<360; angle += Math.round(360/numParticles) ) {
        
        // Create a new particle
        var speed = Math.randomFloat(minSpeed, maxSpeed);
        var particle = new Particle({x: position.x, y: position.y},                   // Position
                                    Math.randomFloat(minSize, maxSize), // Radius
                                    color,                              // Color
                                    Math.randomFloat(minScaleSpeed, maxScaleSpeed), // Scale speed
                                    {x: speed * Math.cos(angle * Math.PI / 180.0),
                                        y: speed * Math.sin(angle * Math.PI / 180.0)}   // Velocity
                                    );

        // Add the particle to the list of particles in the explosion
        this.particles.push(particle);
    }
}


/**
 * @function updates the explosion object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Explosion.prototype.update = function(time) {

    var remove = [];
    if (this.particles.length <= 0) {
        this._killed = true;
        return;	
    }
    
    for (var i = 0; i < this.particles.length; i++){
        this.particles[i].update();
        if(this.particles[i].remove){
            remove.unshift(i);
        }
    }

    for(var i = 0; i < remove.length; i++){
        this.particles.splice(i, 1);
    }
}


/**
 * @function renders the explosion into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Explosion.prototype.render = function(time, ctx) {
    for ( var i = 0; i < this.particles.length; i++) {
        this.particles[i].render(time, ctx);
    }
}


/*
 * randomFloat
 * Augments the Math library with a function
 * to generate random float values between
 * a given interval.
 */
Math.randomFloat = function(min, max){
	return min + Math.random()*(max-min);
};
},{"./particle":11}],10:[function(require,module,exports){
"use strict";

/**
 * @module exports the Game class
 */
module.exports = exports = Game;

/**
 * @constructor Game
 * Creates a new game object
 * @param {canvasDOMElement} screen canvas object to draw into
 * @param {function} updateFunction function to update the game
 * @param {function} renderFunction function to render the game
 */
function Game(screen, updateFunction, renderFunction) {
  this.update = updateFunction;
  this.render = renderFunction;

  // Set up buffers
  this.frontBuffer = screen;
  this.frontCtx = screen.getContext('2d');
  this.backBuffer = document.createElement('canvas');
  this.backBuffer.width = screen.width;
  this.backBuffer.height = screen.height;
  this.backCtx = this.backBuffer.getContext('2d');

  // Start the game loop
  this.oldTime = performance.now();
  this.paused = false;
}

/**
 * @function pause
 * Pause or unpause the game
 * @param {bool} pause true to pause, false to start
 */
Game.prototype.pause = function(flag) {
  this.paused = (flag == true);
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
Game.prototype.loop = function(newTime) {
  var game = this;
  var elapsedTime = newTime - this.oldTime;
  this.oldTime = newTime;

  if(!this.paused) this.update(elapsedTime);
  this.render(elapsedTime, this.frontCtx);

  // Flip the back buffer
  this.frontCtx.drawImage(this.backBuffer, 0, 0);
}

},{}],11:[function(require,module,exports){
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


},{}],12:[function(require,module,exports){
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
},{"./explosion":9,"./shots/shot1":15,"./shots/shot2":16,"./shots/shot3":17,"./shots/shot4":18,"./vector":20}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
"use strict";

const Vector = require('../vector');

const SPEED = 4;

/**
 * @module exports the EnemyShot class
 */
module.exports = exports = EnemyShot;


/**
 * @constructor EnemyShot
 * Creates a new enemyShot object
 * @param {Postition} position object specifying an x and y
 */
function EnemyShot(position, playerPos) {
  this.worldWidth = 810;
  this.worldHeight = 786;
  var direction = Vector.subtract(position, playerPos);
  var position = Vector.add(position, {x:30, y:30});
  this.velocity = Vector.scale(Vector.normalize(direction), SPEED);

  this.position = {
    x: position.x,
    y: position.y
  };
  this.image = new Image();
  this.image.src = 'assets/shots/enemy_shot.png';
  this.radius = 5;
  this.remove = false;
}


/**
 * @function updates the enemyShot object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
EnemyShot.prototype.update = function(time) {
  // Apply velocity
  this.position.x -= this.velocity.x;
  this.position.y -= this.velocity.y;

  if(this.position.x < -50 || this.position.x > this.worldWidth ||
     this.position.y < -50 || this.position.y > this.worldHeight){
    this.remove = true;;
  }
}

/**
 * @function renders the enemyShot into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
EnemyShot.prototype.render = function(time, ctx) {
    ctx.drawImage(this.image, 0 ,0, 11, 11, this.position.x, this.position.y, 10, 10);  
}

},{"../vector":20}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{"../smoke_particles":19}],17:[function(require,module,exports){
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

},{"../smoke_particles":19}],18:[function(require,module,exports){
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

},{"../smoke_particles":19}],19:[function(require,module,exports){
"use strict";

/**
 * @module SmokeParticles
 * A class for managing a particle engine that
 * emulates a smoke trail
 */
module.exports = exports = SmokeParticles;

/**
 * @constructor SmokeParticles
 * Creates a SmokeParticles engine of the specified size
 * @param {uint} size the maximum number of particles to exist concurrently
 */
function SmokeParticles(maxSize, color) {
  this.color = color;
  this.pool = new Float32Array(3 * maxSize);
  this.start = 0;
  this.end = 0;
  this.wrapped = false;
  this.max = maxSize;
}

/**
 * @function emit
 * Adds a new particle at the given position
 * @param {Vector} position
*/
SmokeParticles.prototype.emit = function(position) {
  if(this.end != this.max) {
    this.pool[3*this.end] = position.x;
    this.pool[3*this.end+1] = position.y;
    this.pool[3*this.end+2] = 0.0;
    this.end++;
  } else {
    this.pool[3] = position.x;
    this.pool[4] = position.y;
    this.pool[5] = 0.0;
    this.end = 1;
  }
}

/**
 * @function update
 * Updates the particles
 * @param {DOMHighResTimeStamp} elapsedTime
 */
SmokeParticles.prototype.update = function(elapsedTime) {
  function updateParticle(i) {
    this.pool[3*i+2] += 1.5*elapsedTime;
    if(this.pool[3*i+2] > 2000) this.start = i;
  }
  var i;
  if(this.wrapped) {
    for(i = 0; i < this.end; i++){
      updateParticle.call(this, i);
    }
    for(i = this.start; i < this.max; i++){
      updateParticle.call(this, i);
    }
  } else {
    for(i = this.start; i < this.end; i++) {
      updateParticle.call(this, i);
    }
  }
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
SmokeParticles.prototype.render = function(elapsedTime, ctx) {
  function renderParticle(i){
    var alpha = 1 - (this.pool[3*i+2] / 1000);
    var radius = 0.1 * this.pool[3*i+2];
    if(radius > 5) radius = 5;
    ctx.beginPath();
    ctx.arc(
      this.pool[3*i],   // X position
      this.pool[3*i+1], // y position
      radius, // radius
      0,
      2*Math.PI
    );
    ctx.fillStyle = 'rgba(' + this.color + ',' + alpha + ')';
    ctx.fill();
  }

  // Render the particles individually
  var i;
  if(this.wrapped) {
    for(i = 0; i < this.end; i++){
      renderParticle.call(this, i);
    }
    for(i = this.start; i < this.max; i++){
      renderParticle.call(this, i);
    }
  } else {
    for(i = this.start; i < this.end; i++) {
      renderParticle.call(this, i);
    }
  }
}

},{}],20:[function(require,module,exports){
"use strict";

/**
 * @module Vector
 * A library of vector functions.
 */
module.exports = exports = {
  add: add,
  subtract: subtract,
  scale: scale,
  rotate: rotate,
  dotProduct: dotProduct,
  magnitude: magnitude,
  normalize: normalize
}


/**
 * @function rotate
 * Scales a vector
 * @param {Vector} a - the vector to scale
 * @param {float} scale - the scalar to multiply the vector by
 * @returns a new vector representing the scaled original
 */
function scale(a, scale) {
 return {x: a.x * scale, y: a.y * scale};
}

/**
 * @function add
 * Computes the sum of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed sum
*/
function add(a, b) {
 return {x: a.x + b.x, y: a.y + b.y};
}

/**
 * @function subtract
 * Computes the difference of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed difference
 */
function subtract(a, b) {
  return {x: a.x - b.x, y: a.y - b.y};
}

/**
 * @function rotate
 * Rotates a vector about the Z-axis
 * @param {Vector} a - the vector to rotate
 * @param {float} angle - the angle to roatate by (in radians)
 * @returns a new vector representing the rotated original
 */
function rotate(a, angle) {
  return {
    x: a.x * Math.cos(angle) - a.y * Math.sin(angle),
    y: a.x * Math.sin(angle) + a.y * Math.cos(angle)
  }
}

/**
 * @function dotProduct
 * Computes the dot product of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed dot product
 */
function dotProduct(a, b) {
  return a.x * b.x + a.y * b.y
}

/**
 * @function magnitude
 * Computes the magnitude of a vector
 * @param {Vector} a the vector
 * @returns the calculated magnitude
 */
function magnitude(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}

/**
 * @function normalize
 * Normalizes the vector
 * @param {Vector} a the vector to normalize
 * @returns a new vector that is the normalized original
 */
function normalize(a) {
  var mag = magnitude(a);
  return {x: a.x / mag, y: a.y / mag};
}

},{}]},{},[1]);
