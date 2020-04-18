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

$('#nameSubmit').on('click',function(e){
  var name = $('#name').val();
  $.post(baseUrl+'/getToken',{
    RegistrationToken:''+registrationToken,
    Name: name
}).then((data)=>{
      console.log('Done');
    });
})



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


  $.post(baseUrl+'/getToken',{token:''+token}).then((data)=>{
    console.log('Done');
  });


});

// Display notification
ipcRenderer.on(NOTIFICATION_RECEIVED, (_, serverNotificationPayload) => {
  // check to see if payload contains a body string, if it doesn't consider it a silent push
  console.log(serverNotificationPayload);
  var type = serverNotificationPayload.data.type;
  if( type == 'Nine first'){

    peer = new Peer({initiator:true,trickle:false,wrtc:wrtc});

    peer.on('signal',(data)=>{
      console.log('Generated the offer token. This node is the proctor node');
      $.post(baseUrl+'/sendToken',{OfferToken:JSON.stringify(data)}).then((data)=>{
        console.log('Done');
      });
    });

    console.log('There are no peers available');

    //The peer object here is the initiator.

  }
  else if(type == 'offer'){
    var offerToken = serverNotificationPayload.data.OfferToken;
    peer = new Peer({initiator:false,trickle:false,wrtc:wrtc});

    peer.signal(offerToken);

    peer.on('signal',(data)=>{
      console.log(JSON.stringify(data));

      $.post(baseUrl+'/connectProctor',{AnswerToken:JSON.stringify(data)}).then((data)=>{
        console.log('Done');
      });

    });

    //Here peer is the answer node

    peer.on('connect',(data)=>{
      console.log('Connected to a proctor node');
    });

    //Any data sent by the proctor will be available here by using the peer callbacks
  }
  else if (type == 'answer'){

    //Here is the peer callbacks to connect to the peer answer node.

    console.log(peer);
    console.log('Here in connecting');
    var answerToken = serverNotificationPayload.data.answerToken;
    console.log(answerToken);


    peer.signal(answerToken);


    peer.on('connect',()=>{
      //An answer node is connected to the initiator node that is hosted by this instance.
      //Once the peer is connected , add it to the list of connected peers.
      //If the node is proctor then if the size of the list is 6, then traverse through the list to find the next proctor.
      console.log('Connected');
    });

  }

})

// Start service
const senderId = '159515945544' // <-- replace with FCM sender ID from FCM web admin under Settings->Cloud Messaging
//console.log('starting service and registering a client')
ipcRenderer.send(START_NOTIFICATION_SERVICE, senderId)
