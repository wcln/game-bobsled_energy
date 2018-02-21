/**
 * BCLearningNetwork.com
 * Bobsled Forces
 * @author Colin Bernard (colinjbernard@hotmail.com)
 * January 2018
 */

//// VARIABLES ////
var canvas = document.getElementById("gameCanvas");

var mute = false;
var FPS = 20;

var STAGE_WIDTH, STAGE_HEIGHT;

var gameStarted = false;
var moving = false;

// physics stuff
var velocity_initial; // sled initial velocity (computed)
var time = 0; // time variable (will be incremented)
var mass; // set by user
var force_push; // set by user
var mu_kinetic; // set by user
var PUSHING_TIME = 5; // constant

var start_time; // computed
var last_displacement = 0;

// select boxes
var pushSelect, massSelect, surfaceSelect, positionSelect;

// values for options
var pushOptionValues = [];
pushOptionValues['Small'] = 200;
pushOptionValues['Medium'] = 275;
pushOptionValues['Large'] = 350;

var massOptionValues = [];
massOptionValues['Small'] = 20;
massOptionValues['Medium'] = 24;
massOptionValues['Large'] = 27;

var surfaceOptionValues = [];
surfaceOptionValues['Ice'] = 0.03;
surfaceOptionValues['Snow'] = 0.06;
surfaceOptionValues['Grass'] = 0.08;
surfaceOptionValues['Asphalt'] = 0.12;

var positionOptionValues = [];
positionOptionValues['Low'] = 0.008;
positionOptionValues['Sit'] = 0.012;
positionOptionValues['Stand'] = 0.02;

var currentBackground;

var position_y = 6; // position of bobsled dudes in bobsled

var scoreText;

// Chrome 1+
var isChrome = !!window.chrome && !!window.chrome.webstore;



function init() {
 	STAGE_WIDTH = parseInt(document.getElementById("gameCanvas").getAttribute("width"));
	STAGE_HEIGHT = parseInt(document.getElementById("gameCanvas").getAttribute("height"));

	// init state object
	stage = new createjs.Stage("gameCanvas"); // canvas id is gameCanvas
	stage.mouseEventsEnabled = true;
	stage.enableMouseOver(); // Default, checks the mouse 20 times/second for hovering cursor changes

	setupManifest(); // preloadJS
	startPreload();

	stage.update();
}

function update(event) {
 	if (gameStarted) {

    // bobsled is moving
    if (moving) {

      let time = (new Date().getTime() / 1000) - start_time; // time in seconds

      // Compute displacement
      // d = vt + 4.9*m*mu*t^2
      let displacement = (velocity_initial * time) + (-4.9 * mass * mu_kinetic * Math.pow(time, 2));

      if (displacement - last_displacement < 0) {
        moving = false;
        showScore();
        stage.addChild(reset_button);
      } else {
        // update sled x position
        bobsled.x += displacement - last_displacement;
        updateBobsledDudes();

        last_displacement = displacement;
      }
    }
  }

  updateSelectPositions(); // maintain positions of select HTML elements when page is zoomed or canvas is moved
	stage.update(event);
}

function endGame() {
 	gameStarted = false;
}

function initGraphics() {

  initMuteUnMuteButtons();
  // push guy
  var pushguyData = {
    images: ["images/pushguy_sprite.png"],
    frames: {width: 50, height: 65, count: 3, regX:0, regY: 0, spacing: 0, margin: 0},
    animations: {
      normal: 0,
      push: [0, 2, false]
    }
  }
  pushguy = new createjs.Sprite(new createjs.SpriteSheet(pushguyData));
  pushguy.x = 0;
  pushguy.y = 370;
  pushguy.gotoAndPlay("normal");
  stage.addChild(pushguy);



  // bobsled
  bobsled.x = 20;
  bobsled.y = 360;


  // bobsled dude(s)
  for (var i = 0; i < 3; i++) {
    stage.addChild(bobsled_dudes[i]);
  }
  updateBobsledDudes();

  stage.addChild(bobsled);

  // OVERLAYED SELECT BOXES

  // push select
  var pushSelectHTML = document.createElement('select');
  pushSelectHTML.id = "pushSelect";
  pushSelectHTML.class = "overlayed";
  var pushOptions = ["Small", "Medium", "Large"];
  addOptionsToSelect(pushSelectHTML, pushOptions);
  pushSelectHTML.style.position = "absolute";
  pushSelectHTML.style.top = 0;
  pushSelectHTML.style.left = 0;
  pushSelectHTML.style.width = "70px";
  document.body.appendChild(pushSelectHTML);
  pushSelect = new createjs.DOMElement(pushSelectHTML);

  // mass select
  var massSelectHTML = document.createElement('select');
  massSelectHTML.id = "massSelect";
  massSelectHTML.class = "overlayed";
  var massOptions = ["Small", "Medium", "Large"];
  addOptionsToSelect(massSelectHTML, massOptions);
  massSelectHTML.style.position = "absolute";
  massSelectHTML.style.top = 0;
  massSelectHTML.style.left = 0;
  massSelectHTML.style.width = "70px";
  massSelectHTML.onchange = updateMass;
  massSelectHTML.value = "Large";
  document.body.appendChild(massSelectHTML);
  massSelect = new createjs.DOMElement(massSelectHTML);

  // surface select
  var surfaceSelectHTML = document.createElement('select');
  surfaceSelectHTML.id = "surfaceSelect";
  surfaceSelectHTML.class = "overlayed";
  var surfaceOptions = ["Ice", "Snow", "Grass", "Asphalt"];
  addOptionsToSelect(surfaceSelectHTML, surfaceOptions);
  surfaceSelectHTML.style.position = "absolute";
  surfaceSelectHTML.style.top = 0;
  surfaceSelectHTML.style.left = 0;
  surfaceSelectHTML.style.width = "70px";
  surfaceSelectHTML.onchange = updateSurface;
  surfaceSelectHTML.value = "Asphalt";
  document.body.appendChild(surfaceSelectHTML);
  surfaceSelect = new createjs.DOMElement(surfaceSelectHTML);

  // position select
  var positionSelectHTML = document.createElement('select');
  positionSelectHTML.id = "positionSelect";
  positionSelectHTML.class = "overlayed";
  var positionOptions = ["Low", "Sit", "Stand"];
  addOptionsToSelect(positionSelectHTML, positionOptions);
  positionSelectHTML.style.position = "absolute";
  positionSelectHTML.style.top = 0;
  positionSelectHTML.style.left = 0;
  positionSelectHTML.style.width = "70px";
  positionSelectHTML.onchange = updatePosition;
  positionSelectHTML.value = "Sit";
  document.body.appendChild(positionSelectHTML);
  positionSelect = new createjs.DOMElement(positionSelectHTML);

  updateSelectPositions(); // position the select elements correctly
  stage.addChild(pushSelect);
  stage.addChild(massSelect);
  stage.addChild(surfaceSelect);
  stage.addChild(positionSelect);

  updateMass();
  updateSurface();
  updatePosition();

	initListeners();

  // add go button
  go_button.x = go_button_hover.x = STAGE_WIDTH/2 - go_button.image.width/2;
  go_button.y = go_button_hover.y = 200;
  go_button_hover.cursor = "pointer";
  stage.addChild(go_button);

  // reset button
  reset_button.x = reset_button_hover.x = STAGE_WIDTH/2 - reset_button.image.width/2;
  reset_button.y = reset_button_hover.y = 200;
  reset_button_hover.cursor = "pointer";

  // start the game
	gameStarted = true;
	stage.update();
}

/*
 * Maintain positions of select HTML elements when page is zoomed or canvas is moved
 */
function updateSelectPositions() {
  let selectY = 473; // works well on firefox
  if (isChrome) {
    selectY = 478;
  }

  pushSelect.x = gameCanvas.getBoundingClientRect().left + 65;
  pushSelect.y = gameCanvas.getBoundingClientRect().top + selectY;

  massSelect.x = gameCanvas.getBoundingClientRect().left + 212;
  massSelect.y = gameCanvas.getBoundingClientRect().top + selectY;

  surfaceSelect.x = gameCanvas.getBoundingClientRect().left + 359;
  surfaceSelect.y = gameCanvas.getBoundingClientRect().top + selectY;

  positionSelect.x = gameCanvas.getBoundingClientRect().left + 506;
  positionSelect.y = gameCanvas.getBoundingClientRect().top + selectY;
}

function initListeners() {
  // go button
  go_button_hover.on("mousedown", go);
  go_button.on("mouseover", function() {
    stage.addChild(go_button_hover);
    stage.removeChild(go_button);
  });
  go_button_hover.on("mouseout", function() {
    if (!moving) {
      stage.addChild(go_button);
      stage.removeChild(go_button_hover);
    }
  });

  // reset button
  reset_button_hover.on("mousedown", reset);
  reset_button.on("mouseover", function() {
    stage.addChild(reset_button_hover);
    stage.removeChild(reset_button);
  });
  reset_button_hover.on("mouseout", function() {
    stage.addChild(reset_button);
    stage.removeChild(reset_button_hover);
  });
}

function updateBobsledDudes() {
  for (var i = 0; i < 3; i++) {
    bobsled_dudes[i].x = (bobsled.x + 12) + 22 * i;
    bobsled_dudes[i].y = bobsled.y + position_y;
  }
}

/*
 * Add option elements to a select element
 */
function addOptionsToSelect(select, options) {
  for (var i = 0; i < options.length; i++) {
    var option = document.createElement('option');
    option.value = options[i];
    option.text = options[i];
    select.appendChild(option);
  }
}

/*
 * Adds the mute and unmute buttons to the stage and defines listeners
 */
function initMuteUnMuteButtons() {
	var hitArea = new createjs.Shape();
	hitArea.graphics.beginFill("#000").drawRect(0, 0, muteButton.image.width, muteButton.image.height);
	muteButton.hitArea = unmuteButton.hitArea = hitArea;

	muteButton.x = unmuteButton.x = 5;
	muteButton.y = unmuteButton.y = 5;

	muteButton.cursor = "pointer";
	unmuteButton.cursor = "pointer";

	muteButton.on("click", toggleMute);
	unmuteButton.on("click", toggleMute);

	stage.addChild(unmuteButton);
}

function updateSurface() {
  stage.addChildAt(backgrounds[surfaceSelect.htmlElement.value]);
  stage.removeChild(currentBackground);
  currentBackground = backgrounds[surfaceSelect.htmlElement.value];
}

function updateMass() {
  if (massSelect.htmlElement.value == "Small") {
    stage.removeChild(bobsled_dudes[0]);
    stage.removeChild(bobsled_dudes[1]);
    stage.addChildAt(bobsled_dudes[2], stage.getChildIndex(bobsled) - 1);
  } else if (massSelect.htmlElement.value == "Medium") {
    stage.removeChild(bobsled_dudes[0]);
    stage.addChildAt(bobsled_dudes[1], stage.getChildIndex(bobsled) - 1);
    stage.addChildAt(bobsled_dudes[2], stage.getChildIndex(bobsled) - 1);
  } else if (massSelect.htmlElement.value == "Large") {
    stage.addChildAt(bobsled_dudes[0], stage.getChildIndex(bobsled) - 1);
    stage.addChildAt(bobsled_dudes[1], stage.getChildIndex(bobsled) - 1);
    stage.addChildAt(bobsled_dudes[2], stage.getChildIndex(bobsled) - 1);
  }
}

function updatePosition() {
  if (positionSelect.htmlElement.value == "Low") {
    position_y = 13;
  } else if (positionSelect.htmlElement.value == "Sit") {
    position_y = 6;
  } else if (positionSelect.htmlElement.value == "Stand") {
    position_y = 0;
  }
  updateBobsledDudes();
}

/*
 * Launch the bobsled!
 */
function go() {
  playSound("click");

  // ensure reset button is removed
  stage.removeChild(reset_button);

  // remove the go button from the stage
  stage.removeChild(go_button_hover);

  // set physics variables
  force_push = pushOptionValues[pushSelect.htmlElement.value];
  mass = massOptionValues[massSelect.htmlElement.value];
  mu_kinetic = surfaceOptionValues[surfaceSelect.htmlElement.value] + positionOptionValues[positionSelect.htmlElement.value]; // for air drag just add onto the ground friction (for simplicity sake)


  // compute initial velocity
  velocity_initial = (force_push * PUSHING_TIME) / mass;

  start_time = new Date().getTime() / 1000; // start time in seconds



  last_displacement = 0;

  // push guy animation
  createjs.Tween.get(pushguy).call(function(){pushguy.gotoAndPlay("push")}).wait(700).call(function(){pushguy.gotoAndPlay("normal");});


  moving = true; // update method will run movement code now
}

/*
 * Reset the bobsled for another push
 */
function reset() {
  playSound("click");

  // ensure that moving is set to false (should be anyways)
  moving = false;

  // remove reset button from Stage
  stage.removeChild(reset_button);
  stage.removeChild(reset_button_hover);

  // remove score Text
  stage.removeChild(scoreText);

  // reset bobsled position
  bobsled.x = 20;
  bobsled.y = 360;

  updateBobsledDudes();

  // add the go button to the stage
  stage.addChild(go_button);
}

function showScore() {
  scoreText = new createjs.Text("You made it " + (bobsled.x/10).toFixed(1) + " meters!", '30px Lato', 'black');
  scoreText.x = STAGE_WIDTH/2 - scoreText.getMeasuredWidth()/2;
  scoreText.y = 185;
  stage.addChild(scoreText);
}


//////////////////////// PRELOADJS FUNCTIONS

// bitmap variables
var muteButton, unmuteButton;
var background;
var bobsled;
var go_button, reset_button, go_button_hover, reset_button_hover;
var overlay;
var backgrounds = [];
var pushguy;
var bobsled_dudes = [];


function setupManifest() {
 	manifest = [
    {
      src: "sounds/click.mp3",
      id: "click"
    },
    {
      src: "images/mute.png",
      id: "mute"
    },
    {
      src: "images/unmute.png",
      id: "unmute"
    },
    {
      src: "images/interface.png",
      id: "overlay"
    },
    {
      src: "images/asphalt.png",
      id: "asphalt"
    },
    {
      src: "images/ice.png",
      id: "ice"
    },
    {
      src: "images/grass.png",
      id: "grass"
    },
    {
      src: "images/snow.png",
      id: "snow"
    },
    {
      src: "images/bobsled.png",
      id: "bobsled"
    },
    {
      src: "images/go_button.png",
      id: "go_button"
    },
    {
      src: "images/go_button_hover.png",
      id: "go_button_hover"
    },
    {
      src: "images/reset_button.png",
      id: "reset_button"
    },
    {
      src: "images/reset_button_hover.png",
      id: "reset_button_hover"
    },
    {
      src: "images/bobsled_dude.png",
      id: "bobsled_dude"
    }
 	];
}


function startPreload() {
	preload = new createjs.LoadQueue(true);
    preload.installPlugin(createjs.Sound);
    preload.on("fileload", handleFileLoad);
    preload.on("progress", handleFileProgress);
    preload.on("complete", loadComplete);
    preload.on("error", loadError);
    preload.loadManifest(manifest);
}

function handleFileLoad(event) {
	console.log("A file has loaded of type: " + event.item.type);
  // create bitmaps of images
  if (event.item.id == "mute") {
    muteButton = new createjs.Bitmap(event.result);
  } else if (event.item.id == "unmute") {
    unmuteButton = new createjs.Bitmap(event.result);
  } else if (event.item.id == "bobsled") {
    bobsled = new createjs.Bitmap(event.result);
  } else if (event.item.id == "go_button") {
    go_button = new createjs.Bitmap(event.result);
  } else if (event.item.id == "go_button_hover") {
    go_button_hover = new createjs.Bitmap(event.result);
  } else if (event.item.id == "reset_button") {
    reset_button = new createjs.Bitmap(event.result);
  } else if (event.item.id == "reset_button_hover") {
    reset_button_hover = new createjs.Bitmap(event.result);
  } else if (event.item.id == "overlay") {
    overlay = new createjs.Bitmap(event.result);
  } else if (event.item.id == "asphalt") {
    backgrounds['Asphalt'] = new createjs.Bitmap(event.result);
  } else if (event.item.id == "ice") {
    backgrounds['Ice'] = new createjs.Bitmap(event.result);
  } else if (event.item.id == "snow") {
    backgrounds['Snow'] = new createjs.Bitmap(event.result);
  } else if (event.item.id == "grass") {
    backgrounds['Grass'] = new createjs.Bitmap(event.result);
  } else if (event.item.id == "bobsled_dude") {
    let temp = new createjs.Bitmap(event.result);

    for (var i = 0; i < 3; i++) {
      bobsled_dudes[i] = Object.create(temp);
    }
  }
}

function loadError(evt) {
    console.log("Error!",evt.text);
}

// not currently used as load time is short
function handleFileProgress(event) {

}

/*
 * Displays the start screen.
 */
function loadComplete(event) {
  console.log("Finished Loading Assets");

  // ticker calls update function, set the FPS
	createjs.Ticker.setFPS(FPS);
	createjs.Ticker.addEventListener("tick", update); // call update function

  stage.addChild(backgrounds['Ice']);
  currentBackground = backgrounds['Ice'];
  stage.addChild(overlay);
  stage.update();
  initGraphics();
}

///////////////////////////////////// END PRELOADJS FUNCTIONS
