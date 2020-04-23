// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

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

var peer;

var baseUrl = 'https://adk-signallingserver.herokuapp.com';

var registrationToken;

//offerType peer
var offerToken;

//answerType peer
var answerToken;

var peerName;

//Array to keep track of all the connected nodes
var connectedPeers = [];

$('#nameSubmit').on('click',function(e){
  peerName = $('#name').val();
  $.post(baseUrl+'/getToken',{
    RegistrationToken:''+registrationToken,
    Name: peerName
}).then((data)=>{
      console.log('Done');
    });
    $('#firstWelcome').css('display','none');
    $('#secondaryPage').css('display','block');
    $('#backgroundVideo').css('display','none');
});

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
  })
  return peer;
}



// Listen for service successfully started
ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => {
  console.log('service successfully started', token)
  //console.log('The sent data is ','token = '+token);


  registrationToken = token;

  $('#nameSubmit').prop('disabled',false);
  $('#name').prop('disabled',false);



})

// Handle notification errors
ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_, error) => {
  console.log('notification error', error)
})

// Send FCM token to backend
ipcRenderer.on(TOKEN_UPDATED, (_, token) => {
  console.log('token updated', token)


console.log('Sending token to backend');


  $.post(baseUrl+'/getToken',{
    token:token
  });


});

//This function handles the flow and working of offerType peer
function offerTypeHandler(){

  //Make a new peer object with initiator type to generate offerToken
  peer = makePeerObject(true);

  //This is the callback for when the offerToken from the peer is generated
  peer.on('signal',(data)=>{
    console.log('Generated a new offer token.');

    //Send the offerToken to the server
    $.post(baseUrl+'/setToken',{
      OfferToken:JSON.stringify(data)
    }).then((data)=>{
      console.log('Done');
    });
  });
}

//This function handles the flow and working of answerType peer
function answerTypeHandler(offerToken){
  //Generate a peer object, here the peer will be of answerType
  peer = makePeerObject(false);

  //Generate an answerToken for the proctor node's offerToken
  peer.signal(offerToken);

  //Called when the answerToken is generated
  peer.on('signal',(data)=>{
    console.log('OfferToken generated');

    //Send the generated answerToken to the server to connect with the peer
    $.post(baseUrl+'/connectProctor',{
      AnswerToken:JSON.stringify(data),
      Name:peerName
    });
  });
}



// Display notification
ipcRenderer.on(NOTIFICATION_RECEIVED, (_, serverNotificationPayload) => {
  // check to see if payload contains a body string, if it doesn't consider it a silent push
  console.log(serverNotificationPayload);

  //Get the type of data received from the server
  var type = serverNotificationPayload.data.type;

  //If the type is Nine first then there are no proctor nodes present and this peer has to take up that role
  if( type == 'Nine first'){

    //Call the function to generate and post the new offerToken
    offerTypeHandler();

    console.log('There are no peers available');

    //The peer object here is the initiator.

  }

  //If the received data from the server is of the type offer, there is a proctor
  //node present and its offerToken was sent
  else if(type == 'offer'){
      //Here peer is the answer node

    //Get the proctor node's offerToken
    var offerToken = serverNotificationPayload.data.OfferToken;

    var name = serverNotificationPayload.data.Name;

    answerTypeHandler(offerToken);

    //Called when the answerNode is connected to the proctor node
    peer.on('connect',(data)=>{
      console.log('Connected to a proctor node');
      $('#message').prop('disabled',false);
      $('#send').prop('disabled',false);
    });

    peer.on('data',(data)=>{
      var incomingMessage = "<li id='incomingMessage'><div>"+data+"</div></li>";
      $('#actualMessages').append(incomingMessage);
      console.log(name +' sent '+ data);
    });


        //Any data sent by the proctor will be available here by using the peer callbacks

        //Data can be sent to the proctor node using peer.send() method
        //Data can be received using the peer.on('data',(data)) callback

  }

  //This is the case when this node is the proctor node and an answerType node trying to connect to
  //this node has sent it's answerToken to the server and it is received here from the server
  else if (type == 'answer'){

    //Here is the peer callbacks to connect to the peer answer node.
    console.log('Here in connecting');
    var answerToken = serverNotificationPayload.data.answerToken;
    var name = serverNotificationPayload.data.Name;
    console.log('answerToken generated');


    //This sparks the connection between the two nodes
    peer.signal(answerToken);


    peer.on('connect',()=>{
      //An answer node is connected to the initiator node that is hosted by this instance.
      //Once the peer is connected , add it to the list of connected peers.
      //If the node is proctor then if the size of the list is 6, then traverse through the list to find the next proctor.
      console.log('Connected');
      $('#message').prop('disabled',false);
      $('#send').prop('disabled',false);

      //The peer is connected hence add it to the list to later access it
      connectedPeers.push(peer);

    });

    peer.on('data',(data)=>{
      var incomingMessage = "<li id='incomingMessage'><div>"+data+"</div></li>";
      $('#actualMessages').append(incomingMessage);
      console.log(name+' sent '+data);
    });

  }

  else if(type == 'OfferToken exhausted'){

    offerTypeHandler();

  }

})

//This is the case because an answerToken can only be generated using an offerToken hence an answerToken
//that was created by an offer from another peer cannot be used to connect the two peers.


// TODO:
//Take care of when an answerType node becomes a proctor,i.e prompted by the previous
//proctor to become the proctor. A new peer object has to be created making this answerType node
//an offerType node and sending the offerToken to the server.

$('#send').on('click',function(e){
  var message = $('#message').val();
  console.log(message);
  var sentMess = "<li id='sentMessage'><div>"+message+"</div></li>";
  $('#actualMessages').append(sentMess);
  peer.send(message);
});

// Start service
const senderId = '159515945544' // <-- replace with FCM sender ID from FCM web admin under Settings->Cloud Messaging
//console.log('starting service and registering a client')
ipcRenderer.send(START_NOTIFICATION_SERVICE, senderId)
