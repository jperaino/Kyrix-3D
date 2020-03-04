console.log("loaded test.js")
console.log(globalVar.serverAddr)

function pageOnLoad() {
    //console.log("Server address: " + serverAddr);
    $.ajax({
        type: "GET",
        url: "/canvas",
        data: "id=teamtimeline&predicate0=&predicate1=&predicate2=",
        success: function(data) {
            console.log(JSON.parse(data).staticData);
        }
    });
}