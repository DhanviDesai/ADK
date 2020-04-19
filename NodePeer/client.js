$('#nameSubmit').on('click',function(e){
  var name  = $('#name').val();
  console.log('Clicked',name);
});

$('#send').on('click',function(e){
  var message = $('#message').val();
  console.log(message);
  $('#message').val = '';
});

$('#send').on('click',function(e){
  var message = $('#message').val();
  console.log(message);
  var sentMess = "<li id='sentMessage'><div>"+message+"</div></li>";
  $('#actualMessages').append(sentMess);
});
