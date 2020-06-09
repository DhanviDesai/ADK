

var rankList = [];

var myRank;

var myId;

var rootProcessId;


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

  if(myRank == 0){
    send({to:'allId',data:id});
    rankList = getDirectPeerObjectList();
  }
  return rank;

}

function setRootProcessId(id){
  rootProcessId = id;
}


function send(obj){
  var peerList = getDirectPeerObjectList();

  //send the code to all the peers
  if(obj.to == 'all'){
    var codeData = {
      type: '11',
      data:obj.data
    };
    console.log(codeData);
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

  else if(obj.to == 'allId'){
    var idData = {
      type:'15',
      data:obj.data
    };
    peerList.forEach((peer,i)=>{
      peer.send(JSON.stringify(idData));
    });
  }

  //send the data intended to send by the programmer
  else{
    var index;
    if(obj.to == 0){
      var idList = getDirectPeerId();
      idList.forEach((node, i) => {
        if(node == rootProcessId ){
          index = i;
        }
      });

    }else{
      index = obj.to - 1;
    }
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

  childProcess.exec('echo "'+code+'" > temp1.js');
  require('./temp1.js');
  delete require.cache[require.resolve('./temp1.js')];
}

var receivedData;
var receivedCode;
var isCodeReceived = false;
var isDataReceived = false;
var receivedDataList = [];


async function setReceivedData(data){
  receivedDataList.push(data);
  return true;
}



function setRankList(data){
  rankList = data;
}


function print(something){
    $('#outputProcess').append("<p id='actualOutput'>"+something+"</p");
}


async function recv(obj){
  console.log('This is receivedDataList '+receivedDataList)
  if(receivedDataList.length > 0){
    return receivedDataList.shift();
  }else{
    let result = await setReceivedData();
    if(result){
      return receivedDataList.shift();
    }
  }

}


module.exports = {send,recv,size,rank,print,executeCode,setReceivedData,setRankList,setRootProcessId};
