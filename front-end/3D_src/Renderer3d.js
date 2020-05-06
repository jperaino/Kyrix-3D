const p = require('../js/properties.js')

function Renderer3d(id) {
	
	// assign fields
	this.id = String(id);
	this.opacity = 1;
	this.color_scale = null;
	this.color_metric = null;
	// this.color = p.unselected_hex;
	this.color = 'white';
	this.depth = 120;

}


// exports
module.exports = {
	Renderer3d
}