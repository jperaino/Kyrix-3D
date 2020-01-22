// libraries
const Project = require("../../src/index").Project;
const Canvas = require("../../src/Canvas").Canvas;
const Jump = require("../../src/Jump").Jump;
const Layer = require("../../src/Layer").Layer;
const View = require("../../src/View").View;

// project components
const renderers = require("./renderers");
const transforms = require("./transforms");
const placements = require("./placements");

// construct a project
var p = new Project("dots_deep_uniform", "../../../config.txt");
p.addRenderingParams(renderers.renderingParams);

// ================== zoom level 0 (top) ===================
var topWidth = renderers.topLevelWidth,
    topHeight = renderers.topLevelHeight;
var canvasZero = new Canvas("c0", topWidth, topHeight);
canvasZero.addAxes(renderers.dotsAxes);
p.addCanvas(canvasZero);

// dots layer
var dotsLayer = new Layer(transforms.dotsTransform, false);
canvasZero.addLayer(dotsLayer);
dotsLayer.addPlacement(placements.dotsPlacement);
dotsLayer.addRenderingFunc(renderers.dotsRendering);

// ================== zoom level 1 ===================
var canvasOne = new Canvas("c1", topWidth * Math.pow(2,1), topHeight * Math.pow(2,1));
canvasOne.addAxes(renderers.dotsAxes);
p.addCanvas(canvasOne);
canvasOne.addLayer(dotsLayer);

// ================== zoom level 2 ===================
var canvasTwo = new Canvas("c2", topWidth * Math.pow(2,2), topHeight * Math.pow(2,2));
canvasTwo.addAxes(renderers.dotsAxes);
p.addCanvas(canvasTwo);
canvasTwo.addLayer(dotsLayer);

// ================== zoom level 3 ===================
var canvasThree = new Canvas("c3", topWidth * Math.pow(2,3), topHeight * Math.pow(2,3));
canvasThree.addAxes(renderers.dotsAxes);
p.addCanvas(canvasThree);
canvasThree.addLayer(dotsLayer);

// ================== zoom level 4 ===================
var canvasFour = new Canvas("c4", topWidth * Math.pow(2,4), topHeight * Math.pow(2,4));
canvasFour.addAxes(renderers.dotsAxes);
p.addCanvas(canvasFour);
canvasFour.addLayer(dotsLayer);

// ================== zoom level 5 ===================
var canvasFive = new Canvas("c5", topWidth * Math.pow(2,5), topHeight * Math.pow(2,5));
canvasFive.addAxes(renderers.dotsAxes);
p.addCanvas(canvasFive);
canvasFive.addLayer(dotsLayer);

// ================== zoom level 6 ===================
var canvasSix = new Canvas("c6", topWidth * Math.pow(2,6), topHeight * Math.pow(2,6));
canvasSix.addAxes(renderers.dotsAxes);
p.addCanvas(canvasSix);
canvasSix.addLayer(dotsLayer);

// ================== zoom level 7 ===================
var canvasSeven = new Canvas("c7", topWidth * Math.pow(2,7), topHeight * Math.pow(2,7));
canvasSeven.addAxes(renderers.dotsAxes);
p.addCanvas(canvasSeven);
canvasSeven.addLayer(dotsLayer);

// ================== zoom level 8 ===================
var canvasEight = new Canvas("c8", topWidth * Math.pow(2,8), topHeight * Math.pow(2,8));
canvasEight.addAxes(renderers.dotsAxes);
p.addCanvas(canvasEight);
canvasEight.addLayer(dotsLayer);

// ================== zoom level 9 (bottom) ===================
var canvasNine = new Canvas("c9", topWidth * Math.pow(2,9), topHeight * Math.pow());
canvasNine.addAxes(renderers.dotsAxes);
p.addCanvas(canvasNine);
canvasNine.addLayer(dotsLayer);

// ================== Views ===================
var view = new View("dotview", 0, 0, 1000, 1000);
p.addView(view);
p.setInitialStates(view, canvasZero, 5000, 5000);

// ================== Zooms ===================
p.addJump(new Jump(canvasZero, canvasOne, "literal_zoom_in"));
p.addJump(new Jump(canvasOne, canvasZero, "literal_zoom_out"));

p.addJump(new Jump(canvasOne, canvasTwo, "literal_zoom_in"));
p.addJump(new Jump(canvasTwo, canvasOne, "literal_zoom_out"));

p.addJump(new Jump(canvasTwo, canvasThree, "literal_zoom_in"));
p.addJump(new Jump(canvasThree, canvasTwo, "literal_zoom_out"));

p.addJump(new Jump(canvasThree, canvasFour, "literal_zoom_in"));
p.addJump(new Jump(canvasFour, canvasThree, "literal_zoom_out"));

p.addJump(new Jump(canvasFour, canvasFive, "literal_zoom_in"));
p.addJump(new Jump(canvasFive, canvasFour, "literal_zoom_out"));

p.addJump(new Jump(canvasFive, canvasSix, "literal_zoom_in"));
p.addJump(new Jump(canvasSix, canvasFive, "literal_zoom_out"));

p.addJump(new Jump(canvasSix, canvasSeven, "literal_zoom_in"));
p.addJump(new Jump(canvasSeven, canvasSix, "literal_zoom_out"));

p.addJump(new Jump(canvasSeven, canvasEight, "literal_zoom_in"));
p.addJump(new Jump(canvasEight, canvasSeven, "literal_zoom_out"));

p.addJump(new Jump(canvasEight, canvasNine, "literal_zoom_in"));
p.addJump(new Jump(canvasNine, canvasEight, "literal_zoom_out"));


// save to db
p.saveProject();
