var r = rank();var s = size();if(r==0){send({to:1,data:'Hello'});recv().then((data)=>{print(data);});}else{recv().then((data)=>{print('here');});send({to:0,data:'Helllllooooo'});}
