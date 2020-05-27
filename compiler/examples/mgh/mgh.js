// libraries
const Project = require("../../src/index").Project;
const Canvas = require("../../src/Canvas").Canvas;
const Jump = require("../../src/Jump").Jump;
const Layer = require("../../src/Layer").Layer;
const View = require("../../src/View").View;

// project components (placement is not needed in this example)
const renderers = require("./renderers");
const transforms = require("./transforms");

// construct a project
var p = new Project("mgh", "../../../config.txt");
p.addRenderingParams(renderers.renderingParams);

// ================== the only canvas ===================

// Geometries
var mghCanvas = new Canvas("mgh", 1000, 1000);
p.addCanvas(mghCanvas);

var mghPackLayer = new Layer(transforms.mghTransform, true);
mghCanvas.addLayer(mghPackLayer);
mghPackLayer.addRenderingFunc(renderers.mghPackRendering);

// // Activities
var activitiesCanvas = new Canvas("activities", 1000, 1000);
p.addCanvas(activitiesCanvas);

var activitiesPackLayer = new Layer(transforms.activitiesTransform, true);
activitiesCanvas.addLayer(activitiesPackLayer);
activitiesPackLayer.addRenderingFunc(renderers.mghPackRendering);


// // People
var peopleCanvas = new Canvas("people", 1000, 1000);
p.addCanvas(peopleCanvas);

var peoplePackLayer = new Layer(transforms.peopleTransform, true);
peopleCanvas.addLayer(peoplePackLayer);
peoplePackLayer.addRenderingFunc(renderers.mghPackRendering);

// Fake
var fakeCanvas = new Canvas("fake", 1000, 1000);
p.addCanvas(fakeCanvas);

var fakePackLayer = new Layer(transforms.fakeTransform, true);
fakeCanvas.addLayer(fakePackLayer);
fakePackLayer.addRenderingFunc(renderers.mghPackRendering);



// ================== Views ===================
var view = new View("mgh", 0, 0, 1000, 1000);
p.addView(view);
p.setInitialStates(view, mghCanvas, 0, 0, {
    layer0: {
        OR: [{"==": ["id", "1"]}, {"==": ["parent_id", "1"]}]
    }
});

// ================== self jump ===================
var selector = function() {
    return true;
};

var newViewport = function() {
    return {constant: [0, 0]};
};

var newPredicate = function(row) {
    var pred = {OR: [{"==": ["id", row.id]}, {"==": ["parent_id", row.id]}]};
    return {layer0: pred};
};

var jumpName = function(row) {
    return row.name;
};

p.addJump(
    new Jump(mghCanvas, mghCanvas, "semantic_zoom", {
        selector: selector,
        viewport: newViewport,
        predicates: newPredicate,
        name: jumpName
    })
);

// save to db
p.saveProject();
