//set up a socket connection as this will be the signalling server
//This holds one of the proctor nodes at a given interval of time
//The proctor nodes are changed based on the number of direct peers it has


//Trial using firebase to generate private notification push server

var admin = require('firebase-admin');

var serviceAccount = require('./adk-server-firebase.json');

admin.initializeApp({
  credential : admin.credential.cert(serviceAccount),
  databaseURL : "https://adk-server.firebaseio.com"
});

var port = process.env.PORT || 3000;

const express = require('express');
const http = require('http');


const app = express();

app.use(require('body-parser').urlencoded({
  extended:true
}));


//Server must hold two registrationTokens, one for the proctor node and one for the new incoming node
//1)The client first checks whether it has a peer connected to it, else it sends the data to get connected
//2)The incoming node sends the token as well as the offer key to the server on startup
//3)Then the server sends the offer token to the proctor node to receive the answer token
//4)The server then sends the answer token to the incoming node and then the peer connection is established.


var proctorOfferToken;
var proctorRegistrationToken;

app.post('/getToken',(req,res)=>{
  //console.log(req.body.token)
  console.log('A new peer accessed the server with '+req.body.RegistrationToken);
   sendMessage(req.body.RegistrationToken);
});

app.post('/sendToken',(req,res)=>{
  proctorOfferToken = req.body.OfferToken;
  console.log('roctorOfferToken set');
});

app.get('/',(req,res)=>{
  console.log("hi");
});

app.post('/connectProctor',(req,res)=>{
  var answerToken = req.body.AnswerToken;
  console.log(answerToken);
  var message = {
    data:{
      type : 'answer',
      answerToken : answerToken
    },
    token:proctorRegistrationToken
  }

  admin.messaging().send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });

});

function sendMessage(registrationToken){
  if(proctorOfferToken == undefined ){
    var message = {
    data: {
      type : 'Nine first'
    },
    token: registrationToken
  };
  console.log('Proctor registration token set');
  proctorRegistrationToken = registrationToken;
}else{
  var message = {
  data: {
    type: 'offer',
    OfferToken : proctorOfferToken
  },
  token: registrationToken
};
}

admin.messaging().send(message)
  .then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });

}

app.listen(port,() =>{
console.log('Server up and running in port '+port);
});


//Push notifications has to be used
//If I use push notifications, then the client will communicate with the server and then the server will notify
//the proctor node with all the necessary signalling
