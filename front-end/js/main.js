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
clickable_objects = [];
clickable_uuids = [];

var mouse = new THREE.Vector2(), INTERSECTED;


// UI ===================================================================

function add_buttons(views) {
	/* Adds buttons to the UI to toggle views */

	// Iterate over every mode in views
	$.each(views, (k, v) => {

		// console.log(k, v)

		// Add the button to the UI
		$('#button-row').append(`<button type="button" class="btn btn-primary btn-sm" id=${v.id}>${v.title}</button> `)

		// Add on click function
		$(`#${v.id}`).click(function() {set_canvas(v.id)});
	})
}


// LISTENERS ===================================================================

// Add document event listeners
document.addEventListener('mousemove', on_document_mouse_move, false);
document.onkeydown = on_document_key_down;


// Event listener methods
function on_document_mouse_move(event) {
	/* Updates mouse position data on mouse move */

	event.preventDefault();
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function on_document_key_down(event) {
	/* Performs actions on key clicks */
	console.log(event);

	if(event['key'] === "ArrowUp") {
		cur_level+=1
		// set_canvas(cur_mode, level=cur_level+1);
		set_canvas(cur_mode)
	} else if (event['key'] === "ArrowDown") {
		cur_level-=1
		set_canvas(cur_mode)
		// set_canvas(cur_mode, level=cur_level-1);
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
	/* Update rendera and camera on window resize */

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}


function check_raycaster() {
	/* Cheks if mouse is hovering over any clickable scene objects, and changes color */

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
			console.log(hovered_object);

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
	x = views['Views']
	views_dict = {}

	$.each(x, (k,v)=>{
		views_dict[v.id] = v
	})

	return views_dict
}




// MAIN ===================================================================


function load_geoms(layer, predicate) {
	/* Given predicates, fetches geoms from the backend, constructs objects, and loads them into the scene */
	console.log(`Loading geoms for ${layer}`)

	// Call backend
	$.ajax({
        type: "GET",
        url: "/canvas",
        data: predicate,
        success: function(data) {
        	x = JSON.parse(data).staticData[0]


        	for (var i = 0; i < x.length; i++) {

        		geom = d.get_geom(x[i]);
        		mesh = h3.mesh_from_geom(layer, geom);

        		geom.uuid = mesh.uuid;
        		scene_geoms[geom.uuid] = geom;
        		scene.add(mesh);

        		// Track clickable objects
        		if (layer.clickable === true) {
        			// console.log("layer is clickable")
        			clickable_uuids.push(geom.uuid)
        			clickable_objects.push(mesh)
        		}

        	}
        }
	})
}


function destroy_all_rooms() {
	console.log("destroying everything")

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

	var conditions = [`kind='${layer.kind_filter}'`]
	console.log(cur_level)

	if (layer.level_filter === 'cur_level'){
		conditions.push(`level='${cur_level}'`)
	}
	if (layer.level_filter === 'levels_below'){
		conditions.push(`TO_NUMBER(level, '9999.99')<${cur_level}`)
	}

	var predicate = 'id=mgh&predicate0=('

	var joiner = ''

	$.each(conditions, (k, condition) => {
		predicate = predicate.concat(joiner)
		predicate = predicate.concat(`(${condition})`)
		joiner = 'and'
	})

	predicate = predicate.concat(')')

	console.log(predicate)


	// predicate = `id=mgh&predicate0=((kind='${kind}')and(${condition}))`
	// var predicate = `id=mgh&predicate0=(kind='${layer.kind_filter}')`

	// if (layer.level_filter === 'cur_level')



	console.log(predicate)
	return predicate

}



function add_layer_to_scene(layer) {

	console.log("adding layer to scene")

	predicate = construct_predicate(layer)

	load_geoms(layer, predicate)

}



function set_canvas(canvas_id){
	console.log(`Changing canvas to: ${canvas}`)

	cur_mode = canvas_id;
	var canvas = views[canvas_id]

	destroy_all_rooms();

	toggle_ground_plane(canvas);

	layers = canvas.layers;
	clickable_uuids = [];
	clickable_objects = [];

	// Add each layer to the scene
	$.each(layers, (k,layer) => {
		console.log(layer)
		add_layer_to_scene(layer)
	})
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