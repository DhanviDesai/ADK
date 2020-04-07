const { app, BrowserWindow } = require('electron')
var Peer = require('simple-peer');
var wrtc = require('wrtc');


//Bootstrap nodes should be set up
//Signal handling between the peers should be handled

function createWindow () {
  // Create the browser window.
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker:false
    }
  })

  // and load the index.html of the app.
  win.loadFile('index.html')
  var peer = new Peer({initiator:true,wrtc:wrtc});

  //Use sockets now to communicate

peer.on('signal',data =>{
  //This is where I get the signal data.
  //Communicate with the signalling server here.

console.log(data);
})

peer.on('connect',()=>{
  peer.send('hi');
});
peer.on('data',data=>{
  console.log('hi');
});


}



app.whenReady().then(createWindow)

//When the app runs it is always the initiator, cause it dosent matter who is what, only the signals are important.
//The app contacts with the server to connect to an proctor. If there are no proctors signalling server returns back
//a signal that says this node itself is the proctor
