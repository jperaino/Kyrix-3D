console.log("loaded test.js")
console.log(globalVar.serverAddr)

function pageOnLoad() {
    //console.log("Server address: " + serverAddr);
    $.ajax({
        type: "GET",
        url: "/canvas",
        // data: "id=teamtimeline&predicate0=&predicate1=&predicate2=",
        data: "id=mgh&predicate0=&predicate1=&predicate2=",
        success: function(data) {
        	x = JSON.parse(data).staticData[0]
            console.log(x);
        }
    });
}