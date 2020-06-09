

$('#runButton').on('click',(e)=>{
  //console.log(getDirectPeerObjectList());
  console.log('clicked on run button');
  var code = $('#codeEditor').text();
  console.log(code);
  childProcess.exec('echo "'+code+'" > temp1.js');
  send({to:'allRank',data:getDirectPeerId()});
  send({to:'all',data:code});
  require('./temp1.js');
  delete require.cache[require.resolve('./temp1.js')];


  /*
  var cp = childProcess.fork('temp1.js',{ stdio: 'pipe' },JSON.stringify(getDirectPeerObjectList));
  cp.stdout.on('data',(data)=>{
    console.log(data);
      $('#outputProcess').append("<p id='actualOutput'>"+data+"</p");
  });
  cp.stderr.on('data',(data)=>{
      $('#outputProcess').append("<p id='actualOutput'>"+data+"</p");
  })
  cp.on('close',(data)=>{
    console.log('done');
    childProcess.exec('rm temp1.js');
  });
  */
});
var allTogether = ["VAR","FUNCTION","RETURN","FOR","WHILE","IF","ELSE","ELSE IF","SEND","RECV","PRINT","SIZE","RANK"];
var keywords = ["FUNCTION","RETURN","FOR","WHILE","IF","ELSE","ELSE IF"];
var functions = ["SEND","RECV","PRINT","SIZE","RANK"];
var regexFromMyArray = new RegExp(allTogether.join("|"), 'ig');
//var regExOwnFunctions = new RegExp(ownFunctions.join("|"),'ig');
$('#codeEditor').keyup(function(event){
  document.getElementById('codeEditorDummy').innerHTML = $('#codeEditor').html().replace(regexFromMyArray,function(str){
    if(functions.indexOf(str.trim().toUpperCase())>-1){
      return '<span class="ownHighlight">'+str+'</span>';
    }else if(str.trim().toUpperCase() == "VAR"){
      return '<span class="varHighlight">'+str+'</span>';
    }else{
      return '<span class="highlighted">'+str+'</span>';
    }
  });
  /*document.getElementById('codeEditorDummy').innerHTML = $('#codeEditor').html().replace(regExOwnFunctions,(str)=>{
    return '<span class="ownHighlight">'+str+'</span';
  });*/

});
var target = $("#codeEditorDummy");
  $("#codeEditor").scroll(function() {
    target.prop("scrollTop", this.scrollTop)
          .prop("scrollLeft", this.scrollLeft);
  });
