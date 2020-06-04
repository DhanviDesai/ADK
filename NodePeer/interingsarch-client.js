const { ipcRenderer } = require ('electron')
const {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
} = require ('electron-push-receiver/src/constants')

const Peer = require('simple-peer');
const wrtc = require('wrtc');
var baseUrl = 'https://adk-signallingserver.herokuapp.com';


function makePeerObject(initiator){
  var peer = new Peer({
    initiator:initiator,
    trickle:false,
    wrtc:wrtc,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
      ]
    }
  });
  return peer;
}

/*
*
*
List containing the direct peers for this node.
It contains the data such as the id, offerToken, isOfferTokenValid, openConnections, closedDirect
Every node can have only three connections at most
*
*
*
peerObject = {
id: id of the peer,
offerToken : peer's offerToken,
isOfferTokenValid : boolean value describing whether the above offerToken is valid,
openConnections : number of open connections on the node,
closedDirect : number of closed direct peers,
closedDirectId : list containing the id's of peers that dont have any open connections
*
*
}
*/
var directPeers = ['-1','-1','-1'];


var directPeerObjectList = [];

/*
All nodes when first initialized have 3 open connections
*/
var openConnections = -1;

/*
All nodes have 0 direct peers whose connections are closed when initialized
*/
var closedDirect = 0;

/*
All nodes have no direct peers or their id's when initialized because of above
*/
var closedDirectId = [-1,-1,-1];

/*
There is also this confusion as to which is better, list of all the directly connected peers
id or list of only those which have 0 open connections
if this is chosen, then
*/
var directId = ['-1','-1','-1'];

/*
This node's registraion token
*/
var myRegistraionToken;

/*
This node's newly generated and updated offerToken which is valid
*/
var myCurrentValidOfferToken;

/*
This points to the node's unique id
*/
var myId;

/*
Object that currently points to the type of peer this node is
*/
var peer;


/*
Generates random id of length 6
*/
function IdGenerator (){
  return Math.floor((2 + Math.random()) * 0x80000000)
      .toString(16)
      .substring(3);
}

function postDataToServer(extension,data){

  $.post(baseUrl+'/'+extension,data,()=>{
    //console.log('success');
  })
  .done(()=>{
    //console.log('second success');
  })
  .fail((e)=>{
    console.log('error');
  })
  .always(()=>{
    //console.log('finished');
  });

}

// Listen for service successfully started
ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => {
  console.log('service successfully started', token)
  //console.log('The sent data is ','token = '+token);


  myRegistraionToken = token;

  //Once the registrationToken is assigned, go and get the nodesOnNetwork list from the SS
  myId = IdGenerator();

  console.log('My id is '+myId);

  var data = {
    RegistrationToken:token,
    id: myId
  };

  postDataToServer('getNodes',data);



});

// Handle notification errors
ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_, error) => {
  console.log('notification error', error)
});

// Send FCM token to backend
ipcRenderer.on(TOKEN_UPDATED, (_, token) => {
  console.log('token updated', token)


console.log('Sending token to backend');


  $.post(baseUrl+'/getToken',{
    token:token
  });


});

function newOfferNodeHandler(){

  //This function is used to generate new offerNodes and will be called when this node is connected to something else

  console.log('There are no nodes on the network');
  console.log('I will genrate my offerToken and send it to SS to keep track');
  peer = makePeerObject(true);
  peer.on('signal',(offerToken)=>{
    console.log('Generated a new offerToken');
    myCurrentValidOfferToken = offerToken;
    var peerObject = {
      id:myId,
      registrationToken:myRegistraionToken,
      offerToken:myCurrentValidOfferToken,
      isOfferTokenValid:true,
      openConnections:openConnections,
      closedDirect:closedDirect,
      closedDirectId:closedDirectId
    };
    postDataToServer('addDataToList',peerObject);
  });

}

//This function sends this peer's state to its direct peers
function sendStateToPeer(){

  var peerObject = {
    type:'4',
    id:myId,
    registrationToken:myRegistraionToken,
    openConnections:openConnections,
    closedDirect:closedDirect,
    closedDirectId:closedDirectId,
    directPeers:directPeers,
    directId:directId
  };
  directPeerObjectList.forEach((peer, i) => {
    // The newly connected node and also the new state of this node properties
    // is sent to all the directly connected peers
  peer.send(JSON.stringify(peerObject));
  });

}

// Display notification
ipcRenderer.on(NOTIFICATION_RECEIVED, (_, serverNotificationPayload) => {
  // check to see if payload contains a body string, if it doesn't consider it a silent push
  //console.log(serverNotificationPayload);

  console.log('Notification Received');
  var type = serverNotificationPayload.data.type;
  if(openConnections<3){

    //This condition is for when there are no new nodes available on the network and is sent by SS
  if(type == '1'){
  var selectedNode = serverNotificationPayload.data.selectedNode;
  newOfferNodeHandler();
  }

  //This condition is for when a node is selected from the SS
    else if(type == '2'){
      //An answerType node is created
      var selectedNode = JSON.parse(serverNotificationPayload.data.selectedNode);
      peer = makePeerObject(false);
      console.log('I selected this node, okay no? '+JSON.stringify(selectedNode));
      var offerToken = selectedNode.offerToken;
      peer.signal(offerToken);
      peer.on('signal',(data)=>{
        console.log('I also generated the answerToken for the node with id '+selectedNode.id+', I mean that is what I selected..... so');
        var answerToken = data;
        postDataToServer('selectedNode',{
          id:myId,
          answerToken:answerToken,
          closedDirect:closedDirect,
          closedDirectId:closedDirectId,
          registrationToken:myRegistraionToken,
          selectedRegistrationToken:selectedNode.registrationToken
        });
      });
      peer.on('connect',()=>{
        //Here I will have to create new OfferToken for this node and send it to the SS
        console.log('connected with that I selected that time, remember? I told you no');
        //Update the pointers and values here correctly
        //Communicate the same to the selected direct peer
        openConnections++;
        directId[openConnections] = selectedNode.id;
        directPeers[openConnections] = selectedNode.registrationToken;
        directPeerObjectList.push(peer);
        sendStateToPeer();
        // Create new peer Object
        // Add this to the list of connected peers
        console.log('This is from an answerNode that connected to an offerNode');
        newOfferNodeHandler();

      });
      peer.on('data',(data)=>{
        console.log('received data from someone');
        console.log(JSON.parse(data));
        handleIncomingData(JSON.parse(data));
      });
  }

  //This condition is when an answer token is received from answer node , sent by SS
else if(type == '3'){
  //This is the condition that is entered only by the offerNode
  console.log('Here in I got the answer token');
  var answerToken = serverNotificationPayload.data.answerToken;
  peer.signal(answerToken);
  peer.on('connect',()=>{
    console.log('connect');
    //Also have to check for connection extensions
    //Make proper changes everywhere
    //This is the offerNode another node which is of answerType is connected to this here
    openConnections++;
    directId[openConnections] = serverNotificationPayload.data.id;
    directPeers[openConnections] = serverNotificationPayload.data.registrationToken;
    sendStateToPeer();

    console.log('Here this offernode is conneted to a new answer node');
    console.log('Will generate a new node and make that happen');
    newOfferNodeHandler();

  });
  peer.on('data',(data)=>{
    console.log('received data');
    console.log(JSON.parse(data));
    handleIncomingData(JSON.parse(data));
  });
}
}

});

function handleIncomingData(data){

//Here check whether they have connections.
//If their connected id is with you then dont extend your connection with it.


//This is the data that I get when a new node is connected...

console.log('This is the data that I got in handleIncomingData function');
console.log(data);
var type = data.type;

//This condition is for receiving the direct peers
if(type == '4'){
  var id = data.id;
  var directPeers = data.directId;
  var openConnections = data.openConnections;
  directPeers.forEach((peer, i) => {
    if(peer != myId){
    console.log('This is the id of the directPeer(This is a connected peer)'+peer+' from the peer with id '+id);
    console.log('This is its openConnections '+openConnections);
    console.log('Then think about what to do with this');
  }
  });

}

//To act like a mediator
else if(type == '5'){
  //Here I will have to pass the offerToken from this node's direct node to another direct peer

}


}


// Start service
const senderId = '159515945544' // <-- replace with FCM sender ID from FCM web admin under Settings->Cloud Messaging
//console.log('starting service and registering a client')
ipcRenderer.send(START_NOTIFICATION_SERVICE, senderId)
