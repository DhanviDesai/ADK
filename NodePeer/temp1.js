var r = rank();var s = size();if(r==0){send({to:1,data:'Hello'});}else{recv().then((data)=>{print(data);});send({to:0,data:'Hellllllloooooo'});}
