var r = rank();
var s = size();
print(r);
print(s);
if(r == 0 ){
send({to:1,data:'Hello'});
}
else{
var data = recv({from:0});
print(data);
}