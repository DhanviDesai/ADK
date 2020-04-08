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



// Listen for service successfully started
ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => {
  console.log('service successfully started', token)
  console.log('The sent data is ','token = '+token);

  $.post(baseUrl+'/getToken',{RegistrationToken:''+token}).then((data)=>{
    console.log('Done');
  });

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

  }else if(type == 'offer'){
    var offerToken = serverNotificationPayload.data.OfferToken;
    peer = new Peer({initiator:false,trickle:false,wrtc:wrtc});

    peer.signal(offerToken);

    peer.on('signal',(data)=>{
      console.log(JSON.stringify(data));

      $.post(baseUrl+'/connectProctor',{AnswerToken:JSON.stringify(data)}).then((data)=>{
        console.log('Done');
      });

    });
  }
  else if (type == 'answer'){

    console.log(peer);
    console.log('Here in connecting');
    var answerToken = serverNotificationPayload.data.answerToken;
    console.log(answerToken);


    peer.signal(answerToken);


    peer.on('connect',()=>{
      console.log('Connected');
    });

  }

})

// Start service
const senderId = '159515945544' // <-- replace with FCM sender ID from FCM web admin under Settings->Cloud Messaging
//console.log('starting service and registering a client')
ipcRenderer.send(START_NOTIFICATION_SERVICE, senderId)