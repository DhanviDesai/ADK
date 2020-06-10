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

var { executeCode,setReceivedData,setRankList,setRootProcessId } = require('./distri-core.js');


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
Open connections values of all the directly connected peers
*/
var directPeersOpenConnections=['-1','-1','-1'];

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

//  console.log('There are no nodes on the network');
  //console.log('I will genrate my offerToken and send it to SS to keep track');

  //Makes a new offerType node
  peer = makePeerObject(true);

  //Callback for generating an offerToken
  peer.on('signal',(offerToken)=>{

    //console.log('Generated a new offerToken');

    //This is the currently generated offerToken
    myCurrentValidOfferToken = offerToken;

    //Send this object to SS to keep track of it
    var peerObject = {
      //this node's uid
      id:myId,
      //this node's registration token needed by SS to send notifications
      registrationToken:myRegistraionToken,
      //this node's offerToken that is sent to SS to spread it
      offerToken:myCurrentValidOfferToken,
      //this is a flag value that changes based on the validity of the offerToken
      //isOfferTokenValid:true,(removed for now)
      //Amount of openConnections this node has
      openConnections:openConnections,
      //Number of closedDirectly connected nodes that this node has
      //closedDirect:closedDirect,(removed for now)
      //List containing id of all the directly connected nodes that are closed
      //closedDirectId:closedDirectId(removed for now)
    };

    //send this data to server
    postDataToServer('addDataToList',peerObject);

  });

}

//This function sends this peer's state to its direct peers for InterconnectedRings arch establishment
function sendStateToPeer(peer){

  var peerObject = {
    //type of the message for communication
    type:'4',
    //this node's id ---required---
    id:myId,
    //this node's registrationToken
    //registrationToken:myRegistraionToken,(removed for now)
    //Number of openConnections this node has ---required---
    mainOpenConnections:openConnections,
    //Number of closedConnections direct nodes this node has
    //closedDirect:closedDirect,(removed for now)
    //List containing all the id of directly connected peers that have closedConnections
    //closedDirectId:closedDirectId,(removed for now)
    //List containig all registrationToken of the dierctPeers
    //directPeers:directPeers,(removed for now)
    //List containig all the id of directly connected peers ---required---
    directId:directId
  };

  //send this data to the node that was received as the parameter
  peer.send(JSON.stringify(peerObject));

}

function getDirectPeerObjectList(){

  return directPeerObjectList;
}

function getDirectPeerId(){

  return directId;
}

function getMyId(){

  return myId;
}

function sendOpenConections(peer){
  var sendingMessage = {
    type:'6',
    id:myId,
    openConnections:openConnections
  };

  peer.send(JSON.stringify(sendingMessage));

}

//This does necessary communication with the other nodes to set up the proper data for
//InterconnectedRings Architecture
//Called only when a new node is connected to this node
function doNecessary(type,incomingId,incomingRegistrationToken,incomingOpenConnections){

  //Increment openConnections to indicate that one slot is closed
  openConnections++;

  //set the id of the newly connected node in the list of directly connected nodes Id list
  directId[openConnections] = incomingId;

  //set the registration token of newly connected node in the list of directPeers registrationToken
  directPeers[openConnections] = incomingRegistrationToken;

  //add this peer object to the list of directPeerObjectList
  directPeerObjectList.push(peer);

  //add this peer's openConnections to my list
  directPeersOpenConnections[openConnections] = incomingOpenConnections;

  console.log('This is incomingOpenConnections',incomingOpenConnections);

  console.log('This is directId list '+directId);
  console.log('This is directPeerObjectList '+directPeerObjectList);
  console.log('This is the directPeersOpenConnections ',directPeersOpenConnections);


  //send this data to all the directly connected peers
  if(type == 'offer'){
      sendStateToPeer(peer);
  }

    directPeerObjectList.forEach((peer, i) => {
      sendOpenConections(peer);
    });


}



// Display notification
ipcRenderer.on(NOTIFICATION_RECEIVED, (_, serverNotificationPayload) => {
  // check to see if payload contains a body string, if it doesn't consider it a silent push
  //console.log(serverNotificationPayload);

  console.log('Notification Received');
  var type = serverNotificationPayload.data.type;
  if(openConnections<2){

  //This condition is for when there are no new nodes available on the network and is sent by SS
  if(type == '1'){

    //This will handle the working of creating,posting and setting node on the SS
    newOfferNodeHandler();

  }

  //This condition is for when a node is selected from the SS
    else if(type == '2'){
      //An answerType node is created

      //selectedNode is the node that is sent from the SS after selecting a node
      var selectedNode = JSON.parse(serverNotificationPayload.data.selectedNode);

      //Here an answer node is created
      peer = makePeerObject(false);

      //console.log('I selected this node, okay no? '+JSON.stringify(selectedNode));

      //The selectedNode's offerToken is taken to generate an answerToken for it
      var offerToken = selectedNode.offerToken;

      //Signal is sent with the offerToken to generate the answerToken
      peer.signal(offerToken);

      //This is the callback that is called once the answerToken is generated
      peer.on('signal',(data)=>{

        //console.log('I also generated the answerToken for the node with id '+selectedNode.id+', I mean that is what I selected..... so');

        //Get the answerToken
        var answerToken = data;

        //Send this data to the SS to send it to the offerNode
        postDataToServer('selectedNode',{
          //Id of this node
          id:myId,
          //Generated answerToken for that offerNode
          answerToken:answerToken,
          //How many closedConnections direct peers are present for this
          //closedDirect:closedDirect,(removed for now)
          //List of closedConnections directPeers id
          //closedDirectId:closedDirectId,(removed for now)
          //This node's registration token
          registrationToken:myRegistraionToken,
          openConnections:openConnections,
          //Selected node's registration tokenitem
          selectedRegistrationToken:selectedNode.registrationToken
        });
      });

      //This is the callback when the two nodes are connected
      peer.on('connect',()=>{

            console.log('connected with node having id '+selectedNode.id);

        //Here I will have to create new OfferToken for this node and send it to the SS
        //console.log('connected with that I selected that time, remember? I told you no');
        //Update the pointers and values here correctly
        //Communicate the same to the selected direct peer

        //Do all the necessary communication to set up InterconnectedRings arch
        doNecessary('answer',selectedNode.id,selectedNode.registrationToken,selectedNode.openConnections);

        // Create new peer Object
        // Add this to the list of connected peers
        //console.log('This is from an answerNode that connected to an offerNode');

        //Handles the workin of creating, setting up and saving it in SS
        newOfferNodeHandler();

      });

      //Callback for when the data is received from any one of the peers
      peer.on('data',(data)=>{

        //console.log('received data from someone');
        //console.log(JSON.parse(data));

        //Function that handles all the types of peer to peer communication establishment
        handleIncomingData(JSON.parse(data));

      });
  }

//This condition is when an answer token is received from answer node , sent by SS
else if(type == '3'){

  //This is the condition that is entered only by the offerNode
  //console.log('Here in I got the answer token');

  //Get the answerToken from the data sent from SS
  var answerToken = serverNotificationPayload.data.answerToken;

  //signal this offerNode with received answerToken to connect with it
  peer.signal(answerToken);

  //Callback for when the nodes are connected
  peer.on('connect',()=>{

    console.log('connected with node having id '+serverNotificationPayload.data.id);

    //console.log('connect');
    //Also have to check for connection extensions
    //Make proper changes everywhere
    //This is the offerNode another node which is of answerType is connected to this here

    //Handles all the communication to set up InterconnectedRings arch
    doNecessary('offer',serverNotificationPayload.data.id,serverNotificationPayload.data.registrationToken
    ,serverNotificationPayload.data.openConnections);

    //console.log('Here this offernode is conneted to a new answer node');
    //console.log('Will generate a new node and make that happen');

    newOfferNodeHandler();

  });

  //Callback for when data is received from a node
  peer.on('data',(data)=>{

    //console.log('received data');
    //console.log(JSON.parse(data));

    //handles all the incoming data from the peers to set up InterconnectedRings arch
    handleIncomingData(JSON.parse(data));

  });
}
}

});

function handleIncomingData(data){

//Here check whether they have connections.
//If their connected id is with you then dont extend your connection with it.


//This is the data that I get when a new node is connected...

//console.log('This is the data that I got in handleIncomingData function');
//console.log(data);

//Get the type of incoming data
var type = data.type;

//This condition is for receiving the direct peers from the connected peers
if(type == '4'){

  console.log('Got this data from the peer');
  console.log(data);

  //Get the id of the node that sent this message
  var mainId = data.id;

  //Get the index of this node
  var index;
  directId.forEach((node, i) => {
    if(node == mainId){
      index = i;
    };
  });

  console.log('If I had to send this message, I would send it to '+directPeerObjectList[index]);


  //Get the list of all directly connected peers from the node that sent the message
  var incomingDirectPeersId = data.directId;

  //Get the value of openConnections the node that sent the message has
  var mainOpenConnections = data.mainOpenConnections;

  //Only if this node is not closed, can all the extension of connections happen
  if(mainOpenConnections<2){
    //Do rest all extending connections logic here

    //I can start extending my connection by going through the list of my connected
    //node's directly connected peers
    incomingDirectPeersId.forEach((nodeId, i) => {

      if(nodeId != -1){

        //Check whether this node is me
        if(nodeId != myId){

          //This is true for only its other connected node

          //Here I will ask this node to connect me to that node

          console.log('I will ask the node with id '+mainId+' to connect me with '+nodeId);
          console.log('On my directly connected peers list, the node is on this index '+index);
          peer = makePeerObject(true);
          peer.on('signal',(offerToken)=>{
            //Got the offerToken here to connect with other node,
            var extendConnectionMessage = {
              type:'5',
              id:myId,
              nodeId:nodeId,
              offerToken:offerToken,
            };

            directPeerObjectList[index].send(JSON.stringify(extendConnectionMessage));

          })

        }
      }

    });

  }



//Check for this code once again
/*  directPeers.forEach((peer, i) => {
    if(peer != myId){
    console.log('This is the id of the directPeer(This is a connected peer)'+peer+' from the peer with id '+id);
    console.log('This is its openConnections '+openConnections);
    console.log('Then think about what to do with this');
    if(openConnections < 2){
      console.log('This is another node that is connected to this node');
    }
  }
});*/

}

//To act like a mediator
else if(type == '5'){
  //Here I will have to pass the offerToken from this node's direct node to another direct peer

  console.log('Got message here from '+data.id);
  console.log('This node wants to connect with node '+data.nodeId);

  //Here data.id is the node that wants to connect with the node with id data.nodeId
  directId.forEach((id, i) => {
    if(id == data.nodeId){
      var extensionMessage = {
        type:'7',
        id:myId,
        secondId:data.id,
        offerToken:data.offerToken,
        openConnections:openConnections
      };
      directPeerObjectList[i].send(JSON.stringify(extensionMessage));
    }

  });


}
else if(type == '6'){
  var mainId = data.id;
  var index;
  directId.forEach((id, i) => {
    if(id == mainId){
      directPeersOpenConnections[i] = data.openConnections;
    }
  });

  console.log('This is the updated openConnections',directPeersOpenConnections);

}

else if(type == '7'){
  var offerToken = data.offerToken;
  peer = makePeerObject(false);
  peer.signal(offerToken);
  peer.on('signal',(answerToken) => {
    var extensionConnectionMessage = {
      type:'8',
      answerToken:answerToken,
      id:myId,
      secondId:data.secondId,
      openConnections:openConnections
    };

    var mediateId = data.id;

    directId.forEach((id, i) => {
      if(id == mediateId){
        directPeerObjectList[i].send(JSON.stringify(extendConnectionMessage));
      }
    });


  });

  peer.on('connect',() => {
    //type,id,registrationToken,openConnections
    doNecessary('extension',data.secondId,undefined,data.openConnections);
  });

  peer.on('data',(data) => {
    handleIncomingData(JSON.parse(data));
  })
}

else if(type == '8'){
  var answerToken = data.answerToken;
  peer.signal(answerToken);
  peer.on('connect', () => {
    doNecessary('extension',data.secondId,undefined,data.openConnections);
  });

  peer.on('data', (data) => {
    handleIncomingData(JSON.parse(data));
  });
}

else if(type == '12'){
  console.log('Got data');
  console.log(data.data);
  setReceivedData(data.data);
}

else if(type == '11'){
  console.log('Got code');
  console.log(data.data);
  executeCode(data.data);
}

else if(type == '13'){
  console.log('Got rankList '+data.data);
  setRankList(data.data);
}

else if(type == '15'){
  console.log('Got root processId '+data.data);
  setRootProcessId(data.data);
}




}


// Start service
const senderId = '159515945544' // <-- replace with FCM sender ID from FCM web admin under Settings->Cloud Messaging
//console.log('starting service and registering a client')
ipcRenderer.send(START_NOTIFICATION_SERVICE, senderId);


module.exports = { getDirectPeerObjectList,getDirectPeerId,getMyId };
