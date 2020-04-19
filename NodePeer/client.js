$('#nameSubmit').on('click',function(e){
  var name  = $('#name').val();
  console.log('Clicked',name);
});

$('#send').on('click',function(e){
  var message = $('#message').val();
  console.log(message);
  $('#message').val = '';
});
