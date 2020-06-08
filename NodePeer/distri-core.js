//var adk-core = require('./adk-core');
var list = ['Keerthana','Anand'];
var i=0;

var peerList=[];

//Return the number of processes available
function size(){
  //Get this from the number of open needed processes available
  //Default is 3
  return peerList.length;
}

//This is the uid that is assigned to each process that is available
function rank(){
  //I will have to return the index of this node in the array of available processors
  // of the root node
  return i;
  i++;

}

function send(obj){
  console.log(obj);
}

function recv(obj){
  console.log(obj);
}

function addPeerToList(peer){
  peerList.push(peer);
  console.log(peerList);
}

module.exports = {send,recv,size,rank,addPeerToList};
