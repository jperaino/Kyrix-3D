const p = require('../js/properties.js')

render_fns = {}

function Renderer3d(id) {
	
	// assign fields
	this.id = String(id);
	this.opacity = 1;
	this.color_scale = null;
	this.color_metric = null;
	this.color_metric_max = 6;
	this.color = 'white';
	this.depth = 120;
	this.render_fn = null;

}


var infection_count_render = function(renderer, geom) {

		normalized_metric = geom[renderer.color_metric] / renderer.color_metric_max;
		color = d3.interpolateOrRd(normalized_metric)
		return color
	}


render_fns['infection_count_render'] = infection_count_render;
  
// exports
module.exports = {
	Renderer3d,
	render_fns
}