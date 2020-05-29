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
var directPeers = [];

/*
All nodes when first initialized have 3 open connections
*/
var openConnections = 3;

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
var directId = [-1,-1,-1];
*/

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

// Display notification
ipcRenderer.on(NOTIFICATION_RECEIVED, (_, serverNotificationPayload) => {
  // check to see if payload contains a body string, if it doesn't consider it a silent push
  //console.log(serverNotificationPayload);

  console.log('Notification Received');
  var type = serverNotificationPayload.data.type;
  if(type == '1'){
  var selectedNode = serverNotificationPayload.data.selectedNode;
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
    else if(type == '2'){
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
        console.log('connected with that I selected that time, remember? I told you no');
        //Update the pointers and values here correctly
        //Communicate the same to the selected direct peer
        var peerObject = {
          type:'4',
          id:myId,
          registrationToken:myRegistraionToken,
          openConnections:openConnections,
          closedDirect:closedDirect,
          closedDirectId:closedDirectId
        };
        peer.send(peerObject);
      });
      peer.on('data',(data)=>{
        console.log('received data from someone');
        console.log(data);
        handleIncomingData(data);
      });
  }
else if(type == '3'){
  var answerToken = serverNotificationPayload.data.answerToken;
  peer.signal(answerToken);
  peer.on('connect',()=>{
    console.log('connect');
    //Also have to check for connection extensions
    //Make proper changes everywhere
    //This is the offerNode another node which is of answerType is connected to this here
    var peerObject = {
      val:'FromAns'
    };
    peer.send(peerObject);
  });
  peer.on('data',(data)=>{
    console.log('received data');
    console.log(data);
    handleIncomingData(data);
  });
}

});

function handleIncomingData(data){

}


// Start service
const senderId = '159515945544' // <-- replace with FCM sender ID from FCM web admin under Settings->Cloud Messaging
//console.log('starting service and registering a client')
ipcRenderer.send(START_NOTIFICATION_SERVICE, senderId)
