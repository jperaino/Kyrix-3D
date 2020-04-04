const THREE = require('three');
const OrbitControls = require('three-orbitcontrols');

// Colors
var colors = {
	'background': new THREE.Color( 0xffffff ),
	'selected_hex': 0x0000FF,
	'unselected_hex': 0x000000
};


function init_three () {

	console.log("Initializing three.js")
	/* Initializes three.js */

	// Scene
	scene = new THREE.Scene();
	scene.background = colors.background;

	// Renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.VSMShadowMap;
	renderer.setClearColor( 0xCCCCCC, 1 );
	document.body.appendChild( renderer.domElement );

	// Camera
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 50000 );
	camera.position.set( 10706, 5203, 15119 );

	// Orbit Controls
	controls = new OrbitControls( camera, renderer.domElement );
	controls.enableDamping = true; 
	controls.dampingFactor = 0.05;
	controls.screenSpacePanning = false;
	controls.minDistance = 100;
	controls.maxDistance = 40000;
	controls.maxPolarAngle = Math.PI / 2;
	controls.easing = true;
	controls.target.set(18022,0,12510)

	// Raycasting
	raycaster = new THREE.Raycaster();
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	document.addEventListener( 'click', onDocumentMouseClick, false);
	document.addEventListener( 'mousedown', viewPeople, false);

	// Lights
	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 100, 100, 100 );
	light.intensity = 0.1
	// light.castShadow = true;
	scene.add( light );

	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 23584, 6652, 4096 );
	// light.castShadow = true;
	light.intensity = 0.1
	scene.add( light );

	var light = new THREE.AmbientLight( 0xffffff );
	// light.castShadow = true;
	light.intensity = 0.3;
	scene.add( light );

	// Fog
	scene.fog = new THREE.Fog(0xffffff, 5000, 50000);


	// Window resize listener
	window.addEventListener( 'resize', onWindowResize, false );

	// Load Ground Plane
	loadGroundPlane();


	var dirLight = new THREE.DirectionalLight( 0xFFFFFF, 1 );
					dirLight.name = 'Dir. Light';
					// dirLight.position.set( 10000, 15000, 17000 );
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

	// var shadowHelper = new THREE.CameraHelper( dirLight.shadow.camera );
	// scene.add( shadowHelper );	

}



function animate() {
	/* Required three.js animate() function */

	requestAnimationFrame(animate);
	controls.update();
	TWEEN.update();
	updateCameraLabels(camera, controls)
	render();
}


function set_raycaster_targets(uuids, empty_list=true){
	// console.log(`Setting raycaster targets for ${uuids}`);

	if (empty_list) {
		raycasting_targets = [];
	}

	children = scene.children;
	temp_children = [];
	$.each(children, function(k,v){
		if (uuids.includes(v.uuid)){
			temp_children.push(v);
		}
	});

	raycasting_targets = temp_children;
}



function render() {

	// Find Raycasting Intersections
	raycaster.setFromCamera(mouse, camera);

	var intersects = raycaster.intersectObjects(raycasting_targets);

	if ( intersects.length > 0 ) {
		if ( INTERSECTED != intersects[ 0 ].object ) {
			if ( INTERSECTED ) {
				INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
			}
			INTERSECTED = intersects[ 0 ].object;
			INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
			INTERSECTED.material.emissive.setHex( colors.selected_hex );
			$("#highlighted-info").empty();

			cur_k_obj = uuids[INTERSECTED.uuid];

			console.log(cur_k_obj)
			room_name = cur_k_obj['room']
			building_name = cur_k_obj['building']
			floor_name = cur_k_obj['level']
			infections = cur_k_obj['infections']


			if (mode !== 'infections') {
				$("#room_body").empty();
				$("#room_body").append(
					`<tr><th scope='row'>${room_name}</th><td>${building_name}</td><td>${floor_name}</td><td>${infections}</td></tr>`
					)
			} else {
				console.log(INTERSECTED)
				console.log(INTERSECTED.uuid)
				// $(`#${room_name}`).addClass('table-danger')
			}
		}


	} else {
		if ( INTERSECTED ) {
			INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex )
			if (mode !== 'infections') {
				$("#highlighted-info").empty();
				$("#room_body").empty();
			} else {
				cur_k_obj = uuids[INTERSECTED.uuid];
				room_name = cur_k_obj['room'];
				$(`#${room_name}`).removeClass('table-danger')
			}
		};
		INTERSECTED = null;

	}

	renderer.render( scene, camera );
}


function onDocumentMouseMove(event){
	/* Updates mouse x and y coordinates for three.js raycasting */
	event.preventDefault();
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


function onDocumentMouseDown(event){
	/* Saves the identity of the object that the mouse was over when it is clicked
	in order to verify that mouse click event is over same object. */

	event.preventDefault();
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(raycasting_targets);

	if (intersects.length > 0) {
		INTERSECTED = intersects[0].object
		mouse_down_intersected = INTERSECTED;
	}
}


function onDocumentMouseClick(event){
	/* Handles mouse click events for three.js raycasting */
	event.preventDefault();
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(raycasting_targets);

	if (intersects.length > 0) {
		INTERSECTED = intersects[0].object

		// Check if intersected object is same one when mouse clicked down.
		if (INTERSECTED === mouse_down_intersected) {

			if (mode === 'infections') {
				set_mode('people')
				console.log("not infections")
			} else if (mode === 'people') {
				set_mode('person_rooms')
			} else if (mode === 'person_rooms' || mode === 'room_details') {
				detail_room = uuids[INTERSECTED.uuid];
				console.log(detail_room)
				set_mode('room_details')
			} else {
				onGeometryClick(INTERSECTED.uuid)
			}
		}
	}
}


function onGeometryClick(uuid) {
	/* Performs actions to be performed when a geometry is clicked */
	console.log(uuid)
	k_obj = uuids[uuid]
	building = k_obj['building']
	level = k_obj['level']
	room = k_obj['room']
	
	text = `Building: ${building} | Level: ${level} | Room: ${room}`

	$("#lower-console").text(text) 

	viewRoomsFromLevel(k_obj);
	set_mode('level')
	// mode_to_level(uuids[uuid]['level'])
}


function onWindowResize() {
	/* Update rendera and camera on window resize */
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}





var h3 = {
        init: function(){ init_three() },
    };

module.exports = h3


