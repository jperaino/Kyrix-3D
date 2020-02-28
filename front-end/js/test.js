console.log("loaded test.js")

$.ajax({
    type: "GET",
    url: globalVar.serverAddr + "/canvas",
    data: postData,
    success: function(data) {

    	console.log(data)
        // gvd.curCanvas = JSON.parse(data).canvas;
        // if (gvd.curCanvas.w < gvd.viewportWidth)
        //     gvd.curCanvas.w = gvd.viewportWidth;
        // if (gvd.curCanvas.h < gvd.viewportHeight)
        //     gvd.curCanvas.h = gvd.viewportHeight;
        // gvd.curStaticData = JSON.parse(data).staticData;
        // setupLayerLayouts(viewId);

        // // insert into cache
        // if (!(postData in globalVar.cachedCanvases)) {
        //     globalVar.cachedCanvases[postData] = {};
        //     globalVar.cachedCanvases[postData].canvasObj = gvd.curCanvas;
        //     globalVar.cachedCanvases[postData].staticData =
        //         gvd.curStaticData;
        // }
    }
});

