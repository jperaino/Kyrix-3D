const Canvas3d = require("../3D_src/Canvas3d").Canvas3d;
const Layer3d = require("../3D_src/Layer3d").Layer3d;
const Renderer3d = require("../3D_src/Renderer3d").Renderer3d;

// Initialize canvas list
Views = [];


// CANVAS 1 - ALL BUILDINGS -------------------------------------------------

// Initialize canvas
var allBuildings = new Canvas3d("allBuildings");
allBuildings.title = "All buildings";
allBuildings.subtitle = "Showing all buildings and levels."

// Initialize renderer
var neutral = new Renderer3d("neutral");

// Initialize layer
var allLevels = new Layer3d("allLevels");
allLevels.clickable = true;
allLevels.setRenderer(neutral);

// Add canvas to the project
Views.push(allBuildings)


// CANVAS 2 - ALL BUILDINGS -------------------------------------------------

// Initialize canvas
var roomsByLevel = new Canvas3d("roomsByLevel");
roomsByLevel.title = "Rooms by Level"

// Initialize renderer


// Add canvas to the project
Views.push(roomsByLevel);


module.exports = {
	Views
}