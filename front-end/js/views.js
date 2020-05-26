const Canvas3d = require("../3D_src/Canvas3d").Canvas3d;
const Layer3d = require("../3D_src/Layer3d").Layer3d;
const Renderer3d = require("../3D_src/Renderer3d").Renderer3d;
const Jump3d = require("../3D_src/Jump3d").Jump3d;
const render_fns = require("../3D_src/Renderer3d").render_fns;

// Initialize canvas list
Views = [];


// Initialize renderers
var neutral = new Renderer3d("neutral");
neutral.depth = 110;

var transparent = new Renderer3d("neutral");
transparent.depth = 110;
transparent.opacity = 0.075;

var byInfections = new Renderer3d("byInfections");
byInfections.depth = 120;
byInfections.color_metric = 'infections';
byInfections.render_fn = render_fns['infection_count_render'];


// Initialize jumps
var typical_jump = new Jump3d("typical");


// CANVAS 1 - ALL BUILDINGS -------------------------------------------------

// Initialize canvas
var allBuildings = new Canvas3d("allBuildings");
allBuildings.title = "All buildings";
allBuildings.subtitle = "Showing all buildings and levels."
allBuildings.ground_plane = true;

// Initialize layer
var allLevels = new Layer3d("allLevels");
allLevels.clickable = true;
allLevels.kind_filter = 'Level'
allLevels.setRenderer(neutral);


// Add Jump
var allToLevel = new Jump3d('allToLevel');
allToLevel.nextCanvas = 'roomsByLevel'
allLevels.setJump(allToLevel);

allBuildings.addLayer(allLevels);

// Add canvas to the project
Views.push(allBuildings)


// CANVAS 2 - ROOMS BY LEVEL -------------------------------------------------

// Initialize canvas
var roomsByLevel = new Canvas3d("roomsByLevel");
roomsByLevel.title = "Rooms by Level"


// Initialize room layer
var singleFloorRooms = new Layer3d("singleFloorRooms");
singleFloorRooms.clickable = true;
singleFloorRooms.kind_filter = 'Room';
singleFloorRooms.level_filter = 'cur_level';
singleFloorRooms.setRenderer(byInfections);
singleFloorRooms.setJump(typical_jump);

roomsByLevel.addLayer(singleFloorRooms);

// Initialize transparent floor layer
var lowerLevels = new Layer3d("lowerLevels")
lowerLevels.clickable = false;
lowerLevels.kind_filter = 'Level'
lowerLevels.level_filter = 'levels_below';
lowerLevels.setRenderer(transparent);
lowerLevels.setJump(typical_jump);

roomsByLevel.addLayer(lowerLevels);

// Add canvas to the project
Views.push(roomsByLevel);


// CANVAS 3 - INFECTED ROOMS -------------------------------------------------
var infectedRooms = new Canvas3d('infectedRooms');
infectedRooms.title = "Infected Rooms";

// Initialize room layer
var allInfectedRooms = new Layer3d("allInfectedRooms");
allInfectedRooms.clickable = true;
allInfectedRooms.kind_filter = 'Room';
allInfectedRooms.room_filter = `TO_NUMBER(infections, '9999.99')>0`;
allInfectedRooms.setRenderer(byInfections);
allInfectedRooms.setJump(typical_jump);

infectedRooms.addLayer(allInfectedRooms);

// Initialize transparent floor layer
var allLevelsTranslucent = new Layer3d("allLevelsTranslucent");
allLevelsTranslucent.clickable = false;
allLevelsTranslucent.kind_filter = 'Level'
allLevelsTranslucent.setRenderer(transparent);

infectedRooms.addLayer(allLevelsTranslucent);

// Add canvas to the project
Views.push(infectedRooms);

module.exports = {
	Views
}