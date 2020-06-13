var chartObjects = [];

function setResourcesValues(id,data){
  var p = document.getElementById(''+id);
  p.innerHTML = "Connected to "+id+"<br> free: "+data[0]+" buff: "+data[1]+" cache: "+data[2];
  console.log('Here I will have to draw chart if its not already there and update it if it is');
}

module.exports = { setResourcesValues}
