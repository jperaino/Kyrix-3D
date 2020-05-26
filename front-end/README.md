# Kyrix - 3D Frontend

## 3D frontend for Kyrix
3D visualizations in Kyrix can use much of the same declarative language that Kyrix's 2D frontend uses, with adaptations. Some alterations are necessary to implement 3D scenes and ensure usability. In particular, visual-spatial references are useful when navigating 3D scenes. For instance, when visualizing a specific room in a hospital, it may be helpful to visually key the room into its broader context: a floor, unit, or building. The 3D frontend is designed with this consideration in mind: it assumes that zooming and jumps will occur within a persistent global scene. Jumps in Kyrix 2D allow users to navigate between canvases. However, jumps in 3D Kyrix typically allow users to view different layers within the same canvas.

### Typical Workflow
A typical workflow in 3D Kyrix consists of defining a **scene** to which geometry can be added. A developer can add different types of geometry to the scene using **layers**. Layers use **transform functions** to query a database and select which geometry that should be added to the scene and **rendering functions** that prescribe how the geometry is added to the scene. For instance, a developer could create a layer consisting of only room geometries on the second level of a building, and specify a rendering function that displays these objects as white, opaque rooms within the scene. A developer may wish to present multiple layers at a time; **canvases** allow users to specify which layers are presented in the scene. **Jumps** can be added to any layer and specify which canvas the frontend will present if a user clicks on an object.

#### Scenes
Scenes are a new abstraction in Kyrix3D that create a persistent envrionment for navigating 3D geometry between jumps. In the current implementation, scenes are specified using the three.js 3D library. Developers can add camera controls to a scene to define how a user zooms, pans, and navigates. Developers can also control the scene's visual appearance by adding elements like lighting and fog. 

A developer can adjust a scene by editing the file js/properties_three.js.

#### Canvases
In 3D Kyrix, canvases are used to declare which layers are visible in a scene. A typical canvas specification contains a list of layers to be rendered, along with any 2D user interface elements that should be presented, such as a title or subtitle. Unlike in 2D Kyrix, the scene persists when new canvases are called. This enables the user to stay oriented relative to the rest of the building as details are added or removed from the scene.

A developer can define a canvas in js/views.js


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
