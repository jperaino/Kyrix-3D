const THREE = require('three'); 
const OrbitControls = require('three-orbitcontrols');
const p = require('./properties.js')


// METHODS ===================================================================

function mesh_from_geom(layer, geom) {
	/* Given a geom, returns a mesh to be added to the scene */

	renderer = layer.renderer
	// console.log(renderer)

	// Get the raw vertices
	vertices = [];
	raw_vertices = JSON.parse(geom['outline'])['vertices'];

	// Populate vertices list
	$.each(raw_vertices, (k,v) => {
		vertices.push( new THREE.Vector2(v.x, v.y) );
	})

	var shape = new THREE.Shape(vertices);
	shape.autoClose = true;

	color = 'white'
	// color = 'white'

	if (renderer.render_fn !== null) {
		color = renderer.render_fn(renderer, geom);	
	}

	var depth = renderer.depth
	var transparent = false;
	var opacity = renderer.opacity;

	if (opacity !== 1){
		transparent = true;
	}


	var material = new THREE.MeshPhongMaterial( { color: color, specular: 0x111111, shininess: 0, flatShading: false, transparent: transparent, opacity: opacity} );

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


// function get_color(renderer, geom){
// 	color = 'white'

// 	if (renderer.color_metric !== null) {
// 		normalized_metric = geom[renderer.color_metric] / renderer.color_metric_max;
// 		color = d3.interpolateOrRd(normalized_metric)
// 	} 

// 	return color
// }



// function color_from_metric(m, geom) {
// 	/* Given a geom and a model, returns a color based on that model's metric */

// 	if (m.color_metric !== null) {
// 		normalized_metric = geom[m.color_metric] / m.color_metric_max;
// 	} else {
// 		normalized_metric = 0;
// 	}
	
// 	return d3.interpolateOrRd(normalized_metric);
// }


// PROPERTY METHODS ===================================================================

function get_scene () {
	/* Returns a three.js scene object, including lights */

	// Init Scene
	scene = new THREE.Scene();
	scene.background = p.colors.background;

	// Add Fog
	// scene.fog = new THREE.Fog(p.colors.background, 5000, 50000);

	// Add Lights
	var light = new THREE.DirectionalLight( p.colors.light );
		light.position.set( 100, 100, 100 );
		light.intensity = 0.1
		scene.add( light );

	var light = new THREE.DirectionalLight( p.colors.light );
		light.position.set( 23584, 6652, 4096 );
		light.intensity = 0.1
		scene.add( light );

	var light = new THREE.AmbientLight( p.colors.light );
		light.intensity = 0.3;
		scene.add( light );

	var dirLight = new THREE.DirectionalLight( p.colors.light, 1 );
		dirLight.name = 'Dir. Light';
		dirLight.position.set(8356, 8807, 20395);
		dirLight.target.position.set(16487, 0, 14371);
		dirLight.castShadow = true;
		dirLight.shadow.camera.near = 0.1;
		dirLight.shadow.camera.far = 50000;
		dirLight.shadow.camera.right = 20000;
		dirLight.shadow.camera.left = - 10000;
		dirLight.shadow.camera.top	= 20000;
		dirLight.shadow.camera.bottom = - 30000;
		dirLight.shadow.mapSize.width = 512*4;
		dirLight.shadow.mapSize.height = 512*4;
		dirLight.shadow.radius = 2;
		dirLight.shadow.bias = -0.0001;
		dirLight.intensity = 0.75;
		scene.add( dirLight );
		scene.add( dirLight.target );

	return scene;
}



function get_elements () {
	/* Returns an object containing the three.js renderer, controls, and camera */

	// Renderer
	var renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.VSMShadowMap;
	renderer.setClearColor( 0xCCCCCC, 1 );

	// Camera
	var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 50000 );
	camera.position.set( 10706, 5203, 15119 );

	// Controls
	var controls = new OrbitControls( camera, renderer.domElement );
	controls.enableDamping = true; 
	controls.dampingFactor = 0.05;
	controls.screenSpacePanning = false;
	controls.minDistance = 100;
	controls.maxDistance = 40000;
	controls.maxPolarAngle = Math.PI / 2;
	controls.easing = true;
	controls.target.set(18022,0,12510)

	p3_elements = {
		renderer: renderer,
		controls: controls,
		camera: camera
	}

	return p3_elements
}


function get_ground_plane() {
	/* Returns a ground plane to be added to the scene */

	var geometry = new THREE.PlaneGeometry( 200000, 200000, 32 );
	geometry.rotateX( - Math.PI / 2);
	color = p.colors.background;
	var material = new THREE.MeshPhongMaterial( { color: color, specular: color, shininess: 0, flatShading: false, transparent: true, opacity: 1} );

	var plane = new THREE.Mesh( geometry, material );
	plane.receiveShadow = true;

	plane.position.y += 120;

	return plane;
}



// MODULE EXPORTS ===================================================================

var p3 = {
	get_scene: function(){ return get_scene() },
	get_elements: function() { return get_elements() },
	get_ground_plane: function() { return get_ground_plane() },
	mesh_from_geom: function(m, geom) { return mesh_from_geom(m, geom) }
};


module.exports = p3


