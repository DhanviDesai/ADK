var list = [4,5,6];var r = rank();var s = size();if(r==0){send({to:1,data:[1,2,3]});var localSum = list.reduce((prev,next) => prev+next);recv().then((data) => {localSum += data;print(''+localSum);});}else{recv().then((data) => {var sum = data.reduce((prev,next) => prev+next);send({to:0,data:sum});});}
