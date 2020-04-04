const THREE = require('three');
const p = require('./properties.js')



// PROPERTIES ===================================================================



// METHODS ===================================================================

function mesh_from_geom(geom) {
	/* Given a geom, returns a mesh to be added to the scene */

	// Get the raw vertices
	vertices = [];
	raw_vertices = JSON.parse(geom['outline'])['vertices'];

	// Populate vertices list
	$.each(raw_vertices, (k,v) => {
		vertices.push( new THREE.Vector2(v.x, v.y) );
	})

	var shape = new THREE.Shape(vertices);
	shape.autoClose = true;

	color = p.colors.background;

	var depth = 110;
	var material = new THREE.MeshPhongMaterial( { color: color, specular: 0x111111, shininess: 0, flatShading: false, transparent: true, opacity: 0} );

	var extrude_settings = {depth: depth, bevelEnabled: false};
	var geometry = new THREE.ExtrudeGeometry(shape, extrude_settings);

	var mesh = new THREE.Mesh(geometry, material);

	mesh.position.set( 0, geom.level * 120, 0);
	mesh.rotation.set( - Math.PI / 2, 0, - Math.PI / 2 );
	mesh.scale.set(1,1,1);

	mesh.castShadow = false;
	mesh.receiveShadow = true;

	return mesh;

}



// MODULE EXPORTS ===================================================================

var m3 = {
	mesh_from_geom: function(geom){ return mesh_from_geom(geom) },
	// get_elements: function() { return get_elements() },
	// get_ground_plane: function() { return get_ground_plane() }
};


module.exports = m3