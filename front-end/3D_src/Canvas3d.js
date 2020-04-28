

function Canvas3d(id) {
	// assign fields
	this.id = String(id);
	this.layers = [];
}


// add layer to a canvas
function addLayer(layer) {
	this.layers.push(layer);
}

// add functions to prototype
Canvas3d.prototype.addLayer = addLayer;

// exports
module.exports = {
	Canvas3d
}