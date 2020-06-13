function addReceivedProcess(rootProcessId){
  $('#showExternalProcess').append("<p id='receivedProcess' class='writtenStuffInside'> Executing a process received from "+rootProcessId+"</p>");
}

function addSentProcess(id){
  $('#showInternalProcess').append("<p id='sentProcess'class='writtenStuffInside'> Sent this process to "+id+"</p>");
}

function print(something){
  var finalOutput;
  if(typeof something === "number"){
    finalOutput = something.toString();
  }else{
    finalOutput = something;
  }
  $('#outputProcess').append("<p id='actualOutput' class='writtenStuffInside'>"+finalOutput+"</p");
}

function setIdThere(id){
  $('#headerInstructions').append("<p id='idValue'>My id is "+id+"</p>");
}

function connectedToNode(id){
  $('#showExtraInformation').append("<p class='extraInformtaion' id='"+id+"'> Connected to "+id+"</p>");
}

module.exports = { addReceivedProcess,addSentProcess,print,setIdThere,connectedToNode }
