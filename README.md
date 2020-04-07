# Kyrix - 3D Frontend

## 3D frontend for Kyrix


### Starting:
- Go to the Kyrix main directory and run:
```sudo ./run-kyrix.sh```

- Then compile:
```cd compiler/examples/mgh```
```./compile.sh mgh.js```

-Then go back to the main directory and build:
```./run-kyrix.sh --build```

-After making changes to the frontend, send it to docker. You may need to install browserify
```./sync.sh```

### Data:
-Make sure to load the datas into a table named ```geoms``` in a database named ```mgh```:
```./docker-scripts/load-csv.sh csv/mgh_all_200308.csv --dbname mgh --tablename geoms```