#!/bin/bash

browserify front-end/js/main.js > front-end/bundle.js

# delete the folders first
docker exec -it kyrix_kyrix_1 sh -c "rm -r /kyrix/front-end/js/*"
docker exec -it kyrix_kyrix_1 sh -c "rm -r /kyrix/front-end/static/*"
docker exec -it kyrix_kyrix_1 sh -c "rm /kyrix/front-end/index.html"
docker exec -it kyrix_kyrix_1 sh -c "rm -r /kyrix/front-end/bundle.js"



# copy everything
docker cp front-end/js kyrix_kyrix_1:/kyrix/front-end/
docker cp front-end/static kyrix_kyrix_1:/kyrix/front-end/
docker cp front-end/index.html kyrix_kyrix_1:/kyrix/front-end/index.html
docker cp front-end/bundle.js kyrix_kyrix_1:/kyrix/front-end/bundle.js
