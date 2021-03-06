

var rankList = [];

var myRank;

var myId;

var rootProcessId;

var peerList;


//Return the number of processes available
function size(){
  //Get this from the number of open needed processes available
  //Default is 3
  return getDirectPeerObjectList().length + 1;
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

  peerList = getDirectPeerObjectList();

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
  var idList = getDirectPeerId();
  if(peerList.length > 0 ){
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
        idList.forEach((node, i) => {
          if(node == rootProcessId ){
            index = i;
          }
        });

      }else{
        index = obj.to - 1;
      }
      var sendingData;
      if(typeof obj.data == 'number'){
        sendingData = {
          type:'12',
          data:obj.data
        };
      }else{
        sendingData = {
          type:'12',
          data:Buffer.from(obj.data)
        }
      }
      console.log(sendingData);
      console.log('I am sending this data to other peer');
      if(myRank == 0){
        addSentProcess(idList[index]);
      }
      var peer = peerList[index];
      console.log(peer);
      peer.send(JSON.stringify(sendingData));
    }
  }
}

function executeCode(code){
  if(rootProcessId != undefined){
    addReceivedProcess(rootProcessId);
    childProcess.exec('echo "'+code+'" > temp1.js');
    require('./temp1.js');
    delete require.cache[require.resolve('./temp1.js')];
    childProcess.exec('rm temp1.js');
  }else{
    setTimeout(() => {
      executeCode(code);
    },200);
  }
}

var receivedData;
var receivedCode;
var isCodeReceived = false;
var isDataReceived = false;
var receivedDataList = [];

function setReceivedData(data){
  console.log('Got this data',data);
  if(data.type == 'Buffer'){
    console.log('So i put it here in buffer');
    receivedDataList.push(data.data);
  }else{
    console.log('So i put it here in number');
    receivedDataList.push(data);
  }
}



function setRankList(data){
  rankList = data;
}


var returnedDataTime = 0;

function innerWorking(obj,callback){
  if(obj.from != 'all'){
    if(receivedDataList.length > 0){
      callback(receivedDataList.shift());
    }
  }else{
    setTimeout(() => {
      recv(obj,callback);
    },300);
  }
}

function recv(obj,callback){
///  console.log('This is receivedDataList '+receivedDataList)
if(peerList.length > 0 ){
    if(obj.from !='all'){
      if(receivedDataList.length > 0){
        callback(receivedDataList.shift());
      }else{
        setTimeout(() => {
          recv(obj,callback);
        },300);
      }
    }
    else{
      if(receivedDataList.length == peerList.length){
        callback(receivedDataList);
        receivedDataList=[];
      }else{
        setTimeout(() => {
          recv(obj,callback);
        },300);
      }
    }
  }
}


module.exports = {send,recv,size,rank,executeCode,setReceivedData,setRankList,setRootProcessId};
