//var adk-core = require('./adk-core');
var list = ['Keerthana','Anand'];
var i=0;


//Return the number of processes available
function size(){
  //Get this from the number of open needed processes available
  //Default is 3
  return getDirectPeerObjectList().length;
}

//This is the uid that is assigned to each process that is available
function rank(){
  //I will have to return the index of this node in the array of available processors
  // of the root node
  return i;
  i++;

}


function send(obj){
  var peerList = getDirectPeerObjectList();

  //send the code to all the peers
  if(obj.to == 'all'){
    var codeData = {
      type: '11',
      data:obj.data
    };
    peerList.forEach((peer, i) => {
      peer.send(codeData);
    });

  }

  //send the data intended to send by the programmer
  else{
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
}

function executeCode(){
  if(isCodeReceived && isDataReceived){
    childProcess.exec('echo "'+receivedCode+'" > temp1.js');
    require('./temp1.js');
    delete require.cache[require.resolve('./temp1.js')];
  }
}

var receivedData;
var receivedCode;
var isCodeReceived = false;
var isDataReceived = false;


function setReceivedCode(code){
  receivedCode = code;
  isCodeReceived = true;
  if(isCodeReceived && isDataReceived ){
    executeCode();
  }
}

function setReceivedData(data){
  receivedData = data;
  isDataReceived = true;
  if(isCodeReceived && isDataReceived ){
    executeCode();
  }
}


function print(something){
    $('#outputProcess').append("<p id='actualOutput'>"+something+"</p");
}

function recv(obj){
  return receivedData;
}

module.exports = {send,recv,size,rank,print,receivedCode,receivedData};
