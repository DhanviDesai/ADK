

$('#runButton').on('click',(e)=>{
  console.log(getDirectPeerObjectList());
  console.log('clicked on run button');
  var code = $('#codeEditor').val();
//  console.log(code);
  childProcess.exec('echo "'+code+'" > temp1.js');
  send({to:'allRank',data:getDirectPeerId()});
  send({to:'all',data:''+code});
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
