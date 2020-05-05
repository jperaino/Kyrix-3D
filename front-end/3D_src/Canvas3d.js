

function Canvas3d(id) {
	// assign fields
	this.id = String(id);
	this.layers = [];

	// Geometry
	this.ground_plane = false;

	// UI
	this.title = '';
	this.subtitle = '';
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