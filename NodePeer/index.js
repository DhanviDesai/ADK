const { app, BrowserWindow } = require('electron')
var Peer = require('simple-peer');
var wrtc = require('wrtc');

function createWindow () {
  // Create the browser window.
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  win.loadFile('index.html')
  var peer = new Peer({initiator:true,wrtc:wrtc});

peer.on('signal',data =>{
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
