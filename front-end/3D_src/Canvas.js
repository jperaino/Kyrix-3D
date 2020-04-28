

function Canvas(id) {
	// assign fields
	this.id = String(id);
	this.layers = [];
}


// add layer to a canvas
function addLayer(layer) {
	this.layers.push(layer);
}

// add functions to prototype
Canvas.prototype.addLayer = addLayer;

// exports
module.exports = {
	Canvas
}