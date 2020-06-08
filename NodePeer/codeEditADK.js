var childProcess = require('child_process');

$('#runButton').on('click',(e)=>{
  console.log('clicked on run button');
  var code = $('#codeEditor').val();
  console.log(code);
  childProcess.exec('echo "'+code+'" > temp1.js');
  var cp = childProcess.fork('temp1.js',{ stdio: 'pipe' });
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
});