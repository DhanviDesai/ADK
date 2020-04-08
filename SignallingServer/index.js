//set up a socket connection as this will be the signalling server
//This holds one of the proctor nodes at a given interval of time
//The proctor nodes are changed based on the number of direct peers it has

//This allows implementation with front end....
//With the backend implementation written here as the server, the application will be the front end
//with it being an electron app.


//Trial using firebase to generate private notification push server

var admin = require('firebase-admin');

var serviceAccount = require('./adk-server-firebase.json');

admin.initializeApp({
  credential : admin.credential.cert(serviceAccount),
  databaseURL : "https://adk-server.firebaseio.com"
});

//const socket = require('socket.io');

var port = process.env.PORT || 3000;

//const webpush = require('web-push');
const express = require('express');
const http = require('http');

//const vapidkeys = webpush.generateVAPIDKeys();

//console.log(vapidkeys);

//webpush.setVapidDetails('mailto:dhnvdesai@gmail.com',vapidkeys.publicKey,vapidkeys.privateKey);

const app = express();

app.use(require('body-parser').urlencoded({
  extended:true
}));


app.post('/getToken',(req,res)=>{
  //console.log(req.body.token)
  sendMessage(req.body.token);
});

function sendMessage(registrationToken){
  var message = {
  data: {
    score: '850',
    time: '2:45'
  },
  token: registrationToken
};
admin.messaging().send(message)
  .then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });

}

/*
app.post('/subscribe',(req,res)=>{
  const subscription = req.body;
  res.status(201).json({});
  const payload = JSON.stringify({title:'test'});
  console.log(subscription);

  webpush.sendNotification(subscription,payload).catch(error =>{
    console.log(error.stack);
  });
});
*/
app.listen(port,() =>{
console.log('Server up and running in port '+port);
});


//Push notifications has to be used
//If I use push notifications, then the client will communicate with the server and then the server will notify
//the proctor node with all the necessary signalling
