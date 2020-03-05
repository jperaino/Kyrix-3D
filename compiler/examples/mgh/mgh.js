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
var mghCanvas = new Canvas("mgh", 1000, 1000);
p.addCanvas(mghCanvas);

// logo layer
var mghPackLayer = new Layer(transforms.mghTransform, true);
mghCanvas.addLayer(mghPackLayer);
mghPackLayer.addRenderingFunc(renderers.mghPackRendering);

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
