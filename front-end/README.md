# Kyrix - 3D Frontend

## 3D frontend for Kyrix
3D visualizations in Kyrix can use much of the same declarative language that Kyrix's 2D frontend uses, with adaptations. Some alterations are necessary to implement 3D scenes and ensure usability. In particular, visual-spatial references are useful when navigating 3D scenes. For instance, when visualizing a specific room in a hospital, it may be helpful to visually key the room into its broader context: a floor, unit, or building. The 3D frontend is designed with this consideration in mind: it assumes that zooming and jumps will occur within a persistent global scene. Jumps in Kyrix 2D allow users to navigate between canvases. However, jumps in 3D Kyrix typically allow users to view different layers within the same canvas.

### Typical Workflow
A typical workflow in 3D Kyrix consists of defining a **scene** to which geometry can be added. A developer can add different types of geometry to the scene using **layers**. Layers use **transform functions** to query a database and select which geometry that should be added to the scene and **rendering functions** that prescribe how the geometry is added to the scene. For instance, a developer could create a layer consisting of only room geometries on the second level of a building, and specify a rendering function that displays these objects as white, opaque rooms within the scene. A developer may wish to present multiple layers at a time; **canvases** allow users to specify which layers are presented in the scene. **Jumps** can be added to any layer and specify which canvas the frontend will present if a user clicks on an object.

## Getting Started:
- Go to the Kyrix main directory and run:
```sudo ./run-kyrix.sh```

- Then compile:
```cd compiler/examples/mgh```
```./compile.sh mgh.js```

- Then go back to the main directory and build:
```./run-kyrix.sh --build```

- After making changes to the frontend, send it to docker. You may need to install browserify
```./sync.sh```

### Data:
- Make sure to load the datas into a table named ```geoms``` in a database named ```mgh```:
```./docker-scripts/load-csv.sh csv/mgh_all_200308.csv --dbname mgh --tablename geoms```

## API

#### Scenes
Scenes are a new abstraction in Kyrix3D that create a persistent envrionment for navigating 3D geometry between jumps. In the current implementation, scenes are specified using the three.js 3D library. Developers can add camera controls to a scene to define how a user zooms, pans, and navigates. Developers can also control the scene's visual appearance by adding elements like lighting and fog. 

A developer can adjust a scene by editing the file js/properties_three.js.

#### Canvases
In 3D Kyrix, canvases are used to declare which layers are visible in a scene. A typical canvas specification contains a list of layers to be rendered, along with any 2D user interface elements that should be presented, such as a title or subtitle. Unlike in 2D Kyrix, the scene persists when new canvases are called. This enables the user to stay oriented relative to the rest of the building as details are added or removed from the scene.

A developer can define a canvas in js/views.js. Canvas prototypes are defined in 3D_src/Canvas3d.js. A typical implementation in js/views.js may look like this:

```javascript
// Initialize canvas
var allBuildings = new Canvas3d("allBuildings");

// Add a title and subtitle to be displayed on the page
allBuildings.title = "All buildings"; 
allBuildings.subtitle = "Showing all buildings and levels."

// Specify that the ground plane is visible
allBuildings.ground_plane = true; 
```

#### Layers
Each layer defines a set of geometric objects that should be added to a scene, along with specifications that define how the geometries should be visualized and how user can interact with those objects. In a typical implementation of an architectural visualization, there could be:

1. A layer for rooms to allow users to interact with data associated with each room
2. A layer for building envelopes to enable users to interact with aggregated data for each building or to provide visual context for the room layer.
3. A layer for static contextual information like a surrounding site. 

The developer specifies which geometries should be added to the scene by defining a data transform function for each layer. The developer specifies the appearance of objects on each layer with a rendering function. For instance, a developer could use a transform function to select only rooms that a certain patient has visited, and could then use a rendering function to color code those rooms based on the number of infections present in each room. A developer can also add a jump to the layer, which specifies which canvas loads when a user clicks on any object in the scene.

A developer can define a layers and add them to canvases in js/views.js. Layer prototypes are defined in 3D_src/Layer3d.js.

```javascript
// Initialize layer
var allLevels = new Layer3d("allLevels");

// Specify that the objects on this layer are clickable
allLevels.clickable = true;

// Specify that the predicate should only select 'Level' objects
allLevels.kind_filter = 'Level'

// Add a renderer
allLevels.setRenderer(neutral);

// Add the layer to the canvas
allBuildings.addLayer(allLevels);
``` 

#### Data transforms
Data transforms define which data is retrieved from the backend for any given layer. Data transforms are defined by adjusting layer properties. For instance, setting `layer.level_filter = 'cur_level` tells the layer to construct a predicate where only objects on the scene's current level are selected. 

#### Rendering functions
Rendering functions control the appearance of geometric objects on each layer and define how they are added to the scene. The rendering function also controls the height of objects and whether or not users can interact with them. For instance, if the primary focus of a visualization is patient rooms, then the layer containing patient rooms could have a rendering function that displays the objects as opaque and white. An additional layer for building envelopes could also be included in the canvas, and its rendering function could specify that the objects have a lower opacity and should not interact with the mouse.

A user may specify a color or color function for any layer. For instance, color may be applied along a gradient to visualize the number of infections present in each room.

A developer can define a renderer and add them to a layer in js/views.js. Layer prototypes are defined in 3D_src/Renderer3d.js.

#### Placement functions
Placement functions are not used in the current implementation. Instead, the backend fetches data according to the transform function specified in a given layer.

#### Jumps
Jumps can be added to a layer and specify the canvas to view when an object is clicked, along with any associated transitions.

A developer can define a jump and add it to a layer in js/views.js. Layer prototypes are defined in 3D_src/Jump3d.js.

```javascript
// Initialize jump
var allToLevel = new Jump3d('allToLevel');

// Set the canvas to jump to
allToLevel.nextCanvas = 'roomsByLevel'

// Add the jump to a layer
allLevels.setJump(allLevels);
```

