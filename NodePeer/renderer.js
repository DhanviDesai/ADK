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

//var xhttp = new XMLHttpRequest();


//Have to send the whole json object



// Listen for service successfully started
ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => {
  console.log('service successfully started', token)
  console.log('The sent data is ','token = '+token);

  var peer = new Peer({initiator:true,trickle:false,wrtc:wrtc});

  peer.on('signal',(data)=>{

console.log('Signal',JSON.stringify(data));
      $.post('http://192.168.1.9:3000/getToken',{RegistrationToken:''+token,OfferToken:JSON.stringify(data)});

  });


  // xhttp.open('POST','http://192.168.1.9:3000/getToken',true);
  // xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  // xhttp.send('token='+token);
})

// Handle notification errors
ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_, error) => {
  console.log('notification error', error)
})

// Send FCM token to backend
ipcRenderer.on(TOKEN_UPDATED, (_, token) => {
  console.log('token updated', token)


console.log('Sending token to backend');


  $.post('http://192.168.1.9:3000/getToken',{token:''+token});

// xhttp.open('POST','http://192.168.1.9:3000/getToken',true);
// xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
// xhttp.send('token='+token);

})

// Display notification
ipcRenderer.on(NOTIFICATION_RECEIVED, (_, serverNotificationPayload) => {
  // check to see if payload contains a body string, if it doesn't consider it a silent push
  console.log(serverNotificationPayload);
  /*
  if (serverNotificationPayload.notification.body){
    // payload has a body, so show it to the user
    console.log('display notification', serverNotificationPayload)
    let myNotification = new Notification(serverNotificationPayload.notification.title, {
      body: serverNotificationPayload.notification.body
    })

    myNotification.onclick = () => {
      console.log('Notification clicked')
    }
  } else {
    // payload has no body, so consider it silent (and just consider the data portion)
    console.log('do something with the key/value pairs in the data', serverNotificationPayload.data)
  }
  */
})

// Start service
const senderId = '159515945544' // <-- replace with FCM sender ID from FCM web admin under Settings->Cloud Messaging
//console.log('starting service and registering a client')
ipcRenderer.send(START_NOTIFICATION_SERVICE, senderId)
