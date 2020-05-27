const d3 = require('d3'); 
const THREE = require('three');

const d = require('./data_helpers.js')
const p = require('./properties.js')
const h3 = require('./three_helpers.js')
var views = require('./views.js')


// PROPERTIES ===================================================================
var cur_mode = 'allBuildings';
var cur_level = 8;

var ground_plane_uuid = undefined;
var scene_geoms = {};
var clickable_objects = [];
var clickable_uuids = [];

var mouse = new THREE.Vector2(), INTERSECTED;


// UI ===================================================================

function add_buttons(views) {
	/* Adds buttons to the UI to toggle views */

	// Iterate over every mode in views
	$.each(views, (k, v) => {

		// Add the button to the UI
		$('#button-row').append(`<button type="button" class="btn btn-primary btn-sm" id=${v.id}>${v.title}</button> `)
		// Add on click function
		$(`#${v.id}`).click(function() {set_canvas(v.id)});
	})
}


// LISTENERS ===================================================================

// Add document event listeners
document.addEventListener('mousemove', on_document_mouse_move, false);
document.addEventListener( 'mousedown', onDocumentMouseDown, false );
document.addEventListener( 'click', onDocumentMouseClick, false);
window.addEventListener( 'resize', on_window_resize, false );
document.onkeydown = on_document_key_down;


// Event listener methods
function on_document_mouse_move(event) {
	/* Updates mouse position data on mouse move */

	event.preventDefault();
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


function on_document_key_down(event) {
	/* Updates current level and refreshes geometry on arrow click */
	console.log(event);

	if(event['key'] === "ArrowUp") {
		cur_level+=1
		set_canvas(cur_mode)
	} else if (event['key'] === "ArrowDown") {
		cur_level-=1
		set_canvas(cur_mode)
	}
}


function onDocumentMouseDown(event){
	/* Saves the identity of the object that the mouse was over when it is clicked
	in order to verify that mouse click event is over same object. */

	event.preventDefault();
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(clickable_objects);

	if (intersects.length > 0) {
		INTERSECTED = intersects[0].object
		mouse_down_intersected = INTERSECTED;
	}
}


function onDocumentMouseClick(event){
	/* Handles mouse click events for three.js raycasting */

	event.preventDefault();
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(clickable_objects);

	if (intersects.length > 0) {
		INTERSECTED = intersects[0].object

		// Check if intersected object is same one when mouse clicked down.
		if (INTERSECTED === mouse_down_intersected) {

			// Get the scene object
			object = scene_geoms[INTERSECTED.uuid]
			console.log(object);

			// Select the object's layer data
			layer_id = object['layer'];
			var cur_layer = null;
			$.each(views[cur_mode]['layers'], (k, v) => {
				if (v.id === layer_id) {
					cur_layer = v;
				}
			});

			// Perform the jump
			jump = cur_layer.jump;
			performJump(jump, object);

		}
	}
}


// THREE.JS ===================================================================

var camera, controls, scene, renderer, raycaster;

function init_three_js(){
	/* Loads the three.js scene, elements, and adds it to the DOM */

	// Get scene
	scene = h3.get_scene();

	// Get renderer, camera, and controls
	var h3_elements = h3.get_elements();
	controls = h3_elements.controls
	renderer = h3_elements.renderer
	camera = h3_elements.camera

	// Add Renderer to scene
	document.body.appendChild( renderer.domElement );

	// Add ground plane to scene
	var ground_plane = h3.get_ground_plane();
	scene.add(ground_plane);
	ground_plane_uuid = ground_plane.uuid;

	// Add Raycaster
	raycaster = new THREE.Raycaster();
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

	check_raycaster();
}


function on_window_resize() {
	/* Update renderer and camera on window resize */

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}


function check_raycaster() {
	/* Checks if mouse is hovering over any clickable scene objects, and changes color */

	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(clickable_objects);

	if (intersects.length > 0 ) {
		if (INTERSECTED != intersects[0].object) {
			if(INTERSECTED) {
				INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
			}
			INTERSECTED = intersects[0].object;
			INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
			INTERSECTED.material.emissive.setHex( p.colors.selected_hex );

			var hovered_object = scene_geoms[INTERSECTED.uuid];
		}
	} else {
		if (INTERSECTED) {
			INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex )
		};
		INTERSECTED = null;
	}

	renderer.render(scene, camera);
}


// MAIN HELPERS ===================================================================

function unpack_views(views) {
	/* Structures data for view types */

	x = views['Views']
	views_dict = {}

	$.each(x, (k,v)=>{
		views_dict[v.id] = v
	})

	return views_dict
}


// MAIN ===================================================================
function temp_fn(){
	get_infected_rooms();
}


var get_infected_rooms = function() {

	console.log("getting_infected_rooms");
	var predicate = "id=fake&predicate0="

	$.ajax({
        type: "GET",
        url: "/canvas",
        data: predicate,
        success: function(data) {
        	x = JSON.parse(data).staticData[0]

    		var infected_rooms = new Set();

        	for (var i = 0; i < x.length; i++) {

        		// console.log(x[i]['room'])
        		infected_rooms.add(x[i]['room'])
        




        	}

        	infected_rooms = Array.from(infected_rooms)
        	console.log(`(${infected_rooms.join()})`)

        	// var next_predicate = "id=mgh&predicate0=((kind='Room')and(TO_NUMBER(level, '9999.99')<8))"
        	var next_predicate = `id=mgh&predicate0=((kind='Room')and(room='826'))`
        	// var next_predicate = "id=mgh&predicate0=(kind='Room')"

        	// console.log(views.infectedRooms.layers[0]);


        	load_geoms(views.infectedRooms.layers[0], next_predicate);
        }
	})
}



function load_geoms(layer, predicate) {
	/* Given predicates, fetches geoms from the backend, constructs objects, and loads them into the scene */

	// Call backend
	$.ajax({
        type: "GET",
        url: "/canvas",
        data: predicate,
        success: function(data) {
        	x = JSON.parse(data).staticData[0]

        	for (var i = 0; i < x.length; i++) {

        		// Create object and add to scene
        		geom = d.get_geom(x[i]);
        		mesh = h3.mesh_from_geom(layer, geom);

        		geom.uuid = mesh.uuid;
        		scene_geoms[geom.uuid] = geom;
        		scene_geoms[geom.uuid]['layer'] = layer.id;
        		scene.add(mesh);

        		// Track clickable objects
        		if (layer.clickable === true) {
        			clickable_uuids.push(geom.uuid)
        			clickable_objects.push(mesh)
        		}
        	}
        }
	})
}


function destroy_all_rooms() {
	/* Disposes all scene geoms and associated data from the scene */

	// Iterate over every scene_geom
	$.each(scene_geoms, (k,v) => {
		const object = scene.getObjectByProperty('uuid', k);
		object.geometry.dispose();
		object.material.dispose();
		scene.remove(object);
		delete scene_geoms[k];
	})
}


function toggle_ground_plane(canvas) {
	/* Turns the ground plane on or off per mode's specs */

	const ground_plane = scene.getObjectByProperty('uuid', ground_plane_uuid);

	if(canvas.ground_plane) {
		tweenOpacity(ground_plane, 1, 400);
	} else {
		tweenOpacity(ground_plane, 0, 400);
	}
}


function construct_predicate(layer) {
	/* Given a layer, constructs a predicate */

	// Initialize the conditions
	var conditions = [`kind='${layer.kind_filter}'`]

	// Add a condition to the predicate to filter by level, if specified
	if (layer.level_filter === 'cur_level'){
		conditions.push(`level='${cur_level}'`)
	}
	if (layer.level_filter === 'levels_below'){
		conditions.push(`TO_NUMBER(level, '9999.99')<${cur_level}`)
	}

	// Add a condition to filter by room, if specified
	if (layer.room_filter !== null) {
		conditions.push(layer.room_filter);
	};

	// Initialize the predicate
	var predicate = 'id=mgh&predicate0=('
	var joiner = ''

	// Add all conditions to the predicate
	$.each(conditions, (k, condition) => {
		predicate = predicate.concat(joiner)
		predicate = predicate.concat(`(${condition})`)
		joiner = 'and'
	})

	predicate = predicate.concat(')');
	console.log(predicate)
	return predicate;
}



function add_layer_to_scene(layer) {
	/* Given a layer, constructs a predicate and loads geoemtry to the scene */
	if (layer.transform_fn !== null) {
		eval(layer.transform_fn)();
		// predicate = layer.transform_fn();
		// print(predicate);
	} else {
		predicate = construct_predicate(layer);
		load_geoms(layer, predicate);
	}

	
}


function set_canvas(canvas_id){
	/* Performs actions to update to a new canvas */

	// Get canvas
	cur_mode = canvas_id;
	var canvas = views[canvas_id]

	// Clear scene
	destroy_all_rooms();

	// Update ground plane
	toggle_ground_plane(canvas);

	// Update clickable objects
	layers = canvas.layers;
	clickable_uuids = [];
	clickable_objects = [];

	// Add each layer to the scene
	$.each(layers, (k,layer) => {
		console.log(layer)
		add_layer_to_scene(layer)
	})
}


function performJump(jump, object) {
	/* Performs the specified jump */

	console.log(jump);

	if (jump.update_level) {
		cur_level = object.level;
		set_canvas(jump.nextCanvas);
	}
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



// MAIN METHODS ===================================================================

function init() {

	// Preprocess views
	views = unpack_views(views)

	// Initialize three.js scene
	init_three_js();

	// Add buttons to UI
	add_buttons(views)

	// Set canvas
	first_canvas = "allBuildings"
	set_canvas(first_canvas);
	
}

// MAIN ===================================================================

init();
animate();