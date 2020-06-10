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

module.exports = { addReceivedProcess,addSentProcess,print }
