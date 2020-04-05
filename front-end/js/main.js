const d3 = require('d3');
const THREE = require('three');

const d = require('./data_helpers.js')
const p = require('./properties.js')
const h3 = require('./three_helpers.js')
const modes = require('./modes.js')


// PROPERTIES ===================================================================

var mode = 'buildings';

var ground_plane_uuid = undefined;
var scene_geoms = {};
var clickable_objects = [];

var mouse = new THREE.Vector2(), INTERSECTED;

// UI ===================================================================

$("#infectedRooms").click(function() {set_mode('rooms')} );
$("#viewPlan").click(viewPlan);
$("#viewBuildings").click(function() {set_mode('buildings')} );
$("#viewPeople").click(function() {set_mode('people')} );


// LISTENERS ===================================================================

document.addEventListener('mousemove', on_document_mouse_move, false);



function on_document_mouse_move(event) {
	event.preventDefault();
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}



// AJAX ===================================================================

function load_geoms(kind, condition='') {
	/* Given predicates, fetches geoms from the backend, constructs objects, and loads them into the scene */

	// Form predicate
	var predicate = `id=mgh&predicate0=(kind='${kind}')`;

	if (condition !== '') {
		predicate = `id=mgh&predicate0=((kind='${kind}')and(${condition}))`
		console.log(predicate)
	}

	// Call backend
	$.ajax({
        type: "GET",
        url: "/canvas",
        data: predicate,
        success: function(data) {
        	x = JSON.parse(data).staticData[0]

        	for (var i = 0; i < x.length; i++) {

        		geom = d.get_geom(x[i]);
        		mesh = h3.mesh_from_geom(geom);

        		if (kind === 'Room') {
        			depth = 120;
        			mesh.material.transparent = false;
        			// mesh.receiveShadow = false;
        		}

        		geom.uuid = mesh.uuid;
        		scene_geoms[geom.uuid] = geom;
        		scene.add(mesh);
        		tweenOpacity(geom, 1, 500);

        	}

        	// Continue the mode change routine
        	set_mode_pt_2(mode);
        }
	})
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


// RAYCASTER ===================================================================

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
	/* Given a mode, populats the list of uuids of objects that the mouse can interact with */

	// Reset the list of interactive objects
	var clickable_uuids = [];

	// Iterate through each object in the scene and add to the clickable list, if specified
	$.each(scene_geoms, (k,v) => {
		if ( v.kind === m.clickable_kind) {
			clickable_uuids.push(k)
		}
	})

	temp_children = [];

	// Iterate through each scene object and ad it to the clickable list
	// $.each(clickable_uuids, (k,v) => {
	// 	const object = scene.getObjectByProperty('uuid', v);
	// 	clickable_objects.push(object);
	// })
	$.each(scene.children, (k,v) => {
		if (clickable_uuids.includes(v.uuid)) {
			temp_children.push(v);
		}
	})

	clickable_objects = temp_children;

}


function toggle_ground_plane(m) {
	/* Turns the ground plane on or off per mode's specs */

	const ground_plane = scene.getObjectByProperty('uuid', ground_plane_uuid);

	if(m.ground_plane_on) {
		tweenOpacity(ground_plane, 1, 400);
	} else {
		tweenOpacity(ground_plane, 0, 400);
	}
}


function update_level_opacity(m) {
	/* Given a mode's specifications, update level objects' opacity */

	$.each(scene_geoms, (k,v) => {
		if (v.kind === 'Level') {
			tweenOpacity(v, m.level_opacity, 400)
		}
	})
}


function set_mode(mode){
	/* Perform actions to change the mode before new objects are fetched from the backend */
	console.log(`Updating mode to: ${mode}`)

	m = modes[mode];
	toggle_ground_plane(m);
	update_level_opacity(m);

	if (m.room_condition !== null) {
		load_geoms('Room', condition=m.room_condition)
	}
}


function set_mode_pt_2(mode){
	/* Perform actions to change the mode after new objects are fetched from the backend */

	m = modes[mode];
	set_clickable_objects(m);

}


// MAIN METHODS ===================================================================

function init() {

	init_three_js();
	load_geoms('Level');

	window.addEventListener( 'resize', on_window_resize, false );

	set_mode(mode);
	

}

// MAIN ===================================================================

init();
animate();
