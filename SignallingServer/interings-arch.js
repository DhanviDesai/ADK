//require firebase-admin lib
var admin = require('firebase-admin');
//require the init json file
var serviceAccount = require('./adk-server-firebase.json');
//initialize the firebase admin server
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

//essentials

/*
List containing 10 nodes that are on the network along with its offerToken and number of open connections
*/
var nodesOnNetwork = [];

/*
List to maintain the queue for incoming nodes
*/
var incomingQueue=[];
var front = 0;


//endpoints

app.get('/',(req,res)=>{
  console.log('hi');
});

/*
Function that is contacted by the nodes once they get registrationToken to access the nodes list
@param: body of the request which contains teh new nodes registrationToken and name
@output: sends the nodesOnNetwork list to the new node
*/
app.post('/getNodes',(req,res)=>{
  var registrationToken = req.body.RegistrationToken;
  var id = req.body.id;
  console.log('id of the accessed node is '+id);
  var max = -1;
  var index = -1;
  //Select one random node from the list
  if( nodesOnNetwork.length > 0 ){
  nodesOnNetwork.forEach((peer, i) => {
    if( peer.openConnections > max && i != index ){
      max = peer.openConnections;
      index = i;
    }
  });
  var selectedNode = nodesOnNetwork[index];
  var message = {
    data:{
      type:'1',
      selectedNode: JSON.stringify(selectedNode)
    },
    token:registrationToken
  };
  sendMessage(message);
  res.status(200).send('success');
}else{
  var message = {
    data:{
      type:'1',
      selectedNode:'none'
    },
    token:registrationToken
  };
    sendMessage(message);
    res.status(200).send('success');
  }
});


app.post('/addDataToList',(req,res)=>{
  var peerObject = req.body;
  if(nodesOnNetwork.length < 10){
    nodesOnNetwork.push(peerObject);
    console.log(nodesOnNetwork);
  }
  console.log(peerObject);
  res.status(200).send('success');
});

app.post('/selectedNode',(req,res)=>{
  var selectedNodeInfo = req.body;
  console.log(selectedNodeInfo);
    var answerToken = selectedNodeInfo.answerToken;
    var message = {
      data:{
        type:'2',
        answerToken:JSON.stringify(answerToken)
      },
      token:selectedNodeInfo.selectedRegistrationToken
    };
    sendMessage(message);
    res.status(200).send('success');
});


/*
function to send push notifications
@param : message to send
*/
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
