const { app, BrowserWindow } = require('electron')
var Peer = require('simple-peer');
var wrtc = require('wrtc');

const { setup: setupPushReceiver } = require('electron-push-receiver');


//Bootstrap nodes should be set up
//Signal handling between the peers should be handled

let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker:false
    }
  });

  win.maximize();

  setupPushReceiver(win.webContents);

  // and load the index.html of the app.
  win.loadFile('index.html')



}



app.whenReady().then(createWindow)

//When the app runs it is always the initiator, cause it dosent matter who is what, only the signals are important.
//The app contacts with the server to connect to an proctor. If there are no proctors signalling server returns back
//a signal that says this node itself is the proctor
