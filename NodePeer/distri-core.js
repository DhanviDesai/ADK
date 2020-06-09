

var rankList = [];

var myRank;


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
  var rank = 0;
  var id = getMyId();

  rankList.forEach((peerId, i) => {
    if(peerId == id){
      rank= i+1;
    }
  });
  myRank = rank;
  return rank;

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
      peer.send(JSON.stringify(codeData));
    });

  }

  else if(obj.to == 'allRank'){
    var rankData = {
      type:'13',
      data:obj.data
    };
    peerList.forEach((peer, i) => {
      peer.send(JSON.stringify(rankData));
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

function executeCode(code){
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



var receivedDatalist = [];

function getReceivedData(data){
  if(myRank == 0 ){
    receivedDatalist.push(data);
    if(receivedDatalist.length == rankList.length){
      return receivedDatalist;
    }
  }else{
    return data;
  }
}

function setRankList(data){
  rankList = data;
}


function print(something){
    $('#outputProcess').append("<p id='actualOutput'>"+something+"</p");
}

var index = -1;

//Get data here
async function recv(obj){
  var data = await getReceivedData();
  index++;
  return data[index];
}

module.exports = {send,recv,size,rank,print,setReceivedCode,getReceivedData,setRankList};
