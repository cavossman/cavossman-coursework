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
