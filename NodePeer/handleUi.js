function addReceivedProcess(rootProcessId){
  $('#showExternalProcess').append("<p id='receivedProcess'> Got this process from "+rootProcessId+"</p>");
}

function addSentProcess(id){
  $('#showInternalProcess').append("<p id='sentProcess'> Sent this process to "+id+"</p>");
}

function print(something){
  var finalOutput;
  if(typeof something === "number"){
    finalOutput = something.toString();
  }else{
    finalOutput = something;
  }
  $('#outputProcess').append("<p id='actualOutput'>"+finalOutput+"</p");
}

function setIdThere(id){
  $('#headerInstructions').append("<p id='idValue'>My id is "+id+"</p>");
}

module.exports = { addReceivedProcess,addSentProcess,print,setIdThere }
