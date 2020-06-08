//var adk-core = require('./adk-core');
var list = ['Keerthana','Anand'];
var i=0;

var Peer = require('simple-peer');

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


function send(obj,peerL){
  var peerList = JSON.parse(peerL);
  console.log(peerList);
  console.log(obj.to - 1);
  var index = obj.to - 1;
  var sendingData = {
    type:'12',
    data:obj.data
  };
  console.log(sendingData);
  console.log('I am sending this data to other peer');
  var peer = peerList[index];
  console.log(peer);
  peer.send(JSON.stringify(sendingData));
}

function recv(obj){
  console.log(obj);
}

function addPeerToList(peer){
  peer.send(JSON.stringify({data:'sent from distri-core.js'}));
  peerList.push(peer);
}

function printOutput(x){
  console.log(x);
}

module.exports = {send,recv,size,rank,addPeerToList,printOutput};
