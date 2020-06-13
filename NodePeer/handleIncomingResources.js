var chartObjects = [];

function setResourcesValues(data){
  var p = document.getElementById(''+data.id);
  p.innerHTML = "Connected to "+data.id+"<br> free: "+data.data[0]+"<br> buff: "+data.data[1]+"<br> cache: "+data.data[2];
  console.log('Here I will have to draw chart if its not already there and update it if it is');
}

module.exports = { setResourcesValues}
