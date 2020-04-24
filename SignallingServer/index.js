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

app.use(express.static('public'));


//Server must hold two registrationTokens, one for the proctor node and one for the new incoming node
//1)The client first checks whether it has a peer connected to it, else it sends the data to get connected
//2)The incoming node sends the token as well as the offer key to the server on startup
//3)Then the server sends the offer token to the proctor node to receive the answer token
//4)The server then sends the answer token to the incoming node and then the peer connection is established.


//If the proctor is an offerType peer
var proctorOfferToken;

var isProctorTokenValid = false;

//If the proctor is an ansertType peer
var proctorAnswerToken;


var proctorRegistrationToken;

//Peer Name
var proctorName;


//Incoming peer registrationToken queue

//Incoming peers list
var incomingPeers = [];
//Index variable for removing peers from queue
var front = 0;

//This points to the waiting and validity of the current offerToken
var addToList = false;


//This is the endpoint for getting proctor details and other information
app.post('/getToken',(req,res)=>{
  console.log('A new peer accessed the server with '+req.body.RegistrationToken);
  console.log('Name of the sender is '+req.body.Name);
  var message = {};

  //When no offerToken is set in SS
  if(proctorOfferToken == undefined){
    message = {
      data: {
      type:'Nine first',
    },
    token:req.body.RegistrationToken
  }
  proctorRegistrationToken = req.body.RegistrationToken;
  proctorName = req.body.Name;

  console.log('Proctor registration token and proctor name set');

  }

  //When the offerToken that is available is not valid cause some other peer
  //generated an answer token for this
  else if (!isProctorTokenValid || addToList){
    incomingPeers.push(req.body.RegistrationToken);
    console.log('Added this peer to the list as Proctor token is not valid or addToList is true');
  }

  //This is the case when the offerToken avaialbe is valid
  else if( isProctorTokenValid && !addToList){
    message = {
      data:{
        type:'offer',
        OfferToken: proctorOfferToken,
        Name:proctorName
      },
      token:req.body.RegistrationToken
    }

    addToList = true;

    console.log('Send the offerToken to this node and made addToList true');

  }
   sendMessage(message);
});

//This is the endpoint for setting the offerToken of the proctor
app.post('/setToken',(req,res)=>{
  proctorOfferToken = req.body.OfferToken;
  isProctorTokenValid = true;
  addToList = false;
  console.log('proctorOfferToken set and isProctorTokenValid is made true');
  postOfferToken();
});


//This handles the work to be done once the offerToken is set
function postOfferToken(){

  //Return from the function if there are no peers to whom the new token should be sent
  if(incomingPeers.length == 0 ){
    return;
  }

  //If there are peers who are waiting for an offerToken
  else {
    var registrationToken = incomingPeers[front];
    front++;
    var message = {
      data :{
        type:'Offer',
        OfferToken:proctorOfferToken,
        Name:proctorName
      },
      token:registerationToken
    };
    sendMessage(message);
  }
}

//This is the enpoint simply added to respond for browser calls
app.get('/',(req,res)=>{
  console.log("hi");
});

//This is the endpoint where the answerPeer sends the answerToken to connect with the peer
app.post('/connectProctor',(req,res)=>{
  var answerToken = req.body.AnswerToken;
  var answerNodeName = req.body.Name;
  console.log('Received an answerToken');

  //This is the message to be sent to the new peer, with offerToken
  var messageNode = {
    data:{
      type : 'answer',
      Name : answerNodeName,
      answerToken : answerToken
    },
    token:proctorRegistrationToken
  }

  //It is made false since the offerToken is already sent to a peer to generate an answerToken
  isProctorTokenValid = false;

  console.log('isProctorTokenValid is made false since an answerToken is already generated');

  sendMessage(messageNode);

  //This is the message to be sent to the proctor node
  var messageProctor = {
    data : {
      type : 'OfferToken exhausted'
    },
    token:proctorRegistrationToken
  }

  //sendMessage(messageProctor);

});


//Firebase send push message to the peer
function sendMessage(message){

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
