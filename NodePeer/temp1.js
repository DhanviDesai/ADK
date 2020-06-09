var r = rank();var s = size();if(r==0){send({to:1,data:'Hello'});print(recv({from:1}));}else{var data = recv({from:0});print(data);send({to:0,data:'Helllllloooo'});}
