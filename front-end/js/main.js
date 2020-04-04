const d3 = require('d3');

const d = require('./data_helpers.js')
const p = require('./properties.js')
const p3 = require('./properties_three.js')
const m3 = require('./methods_three.js')
const modes = require('./modes.js')


// PROPERTIES ===================================================================

var mode = 'buildings'

var uuids = {
	ground_plane: undefined,
	// geoms: []
};

var scene_geoms = {};

// AJAX ===================================================================

function load_geoms(kind, condition='') {
	/* Given predicates, fetches geoms from the backend, constructs objects, and loads them into the scene */

	// Form predicate
	var predicate = `id=mgh&predicate0=(kind='${kind}')`;

	if (condition !== '') {
		console.log("here")
		predicate = `id=mgh&predicate0=((kind='${kind}')and(${condition}))`
	}


	$.ajax({
        type: "GET",
        url: "/canvas",
        data: predicate,
        success: function(data) {
        	x = JSON.parse(data).staticData[0]

        	for (var i = 0; i < x.length; i++) {

        		geom = d.get_geom(x[i]);
        		mesh = m3.mesh_from_geom(geom);
        		geom.uuid = mesh.uuid;
        		scene_geoms[geom.uuid] = geom;
        		scene.add(mesh);
        		tweenOpacity(geom, 1, 500);

        	}
        }
	})
}


// THREE.JS ===================================================================

var camera, controls, scene, renderer, raycaster;

function init_three_js(){
	/* Loads the three.js scene, elements, and adds it to the DOM */

	// Get scene
	scene = p3.get_scene();

	// Get renderer, camera, and controls
	var p3_elements = p3.get_elements();
	controls = p3_elements.controls
	renderer = p3_elements.renderer
	camera = p3_elements.camera

	// Add Renderer to scene
	document.body.appendChild( renderer.domElement );

	// Add ground plane to scene
	var ground_plane = p3.get_ground_plane();
	scene.add(ground_plane);
	uuids.ground_plane = ground_plane.uuid;
}


function animate(){
	/* Required three.js animate function */

	requestAnimationFrame(animate);
	controls.update();
	TWEEN.update();
	render();
}


function render(){
	/* Required three.js render function */

	renderer.render( scene, camera );
}


function on_window_resize() {
	/* Update rendera and camera on window resize */

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}


// TWEENS ===================================================================

function tweenOpacity(geom, new_opacity, duration) {
	/* Given a geom, tweens the opacity */

	mesh = scene.getObjectByProperty('uuid', geom.uuid);

	new TWEEN.Tween(mesh.material).to({
		opacity: new_opacity,
	}, duration)
	.easing(TWEEN.Easing.Quadratic.InOut)
	.start();

	if (new_opacity > 0.5) {
		mesh.castShadow = true;
	} else {
		mesh.castShadow = false;
	}
}


// UPDATE MODE ===================================================================

function set_clickable_objects(m) {

	clickable_objects = m.clickable;

	$.each()

}


function update_mode_to(mode){

	// Fetch mode properties
	m = modes[mode];

	console.log(m);



}


// MAIN METHODS ===================================================================

function init() {

	init_three_js();
	load_geoms('Level');
	load_geoms('Room', "level='8'")

	window.addEventListener( 'resize', on_window_resize, false );

	update_mode_to('buildings');

}

// MAIN ===================================================================

init();
animate();






