function generateRandomData(){var list = [];for(var i=1;i<21;i++){list.push(i);}return list;}var r = rank();var s = size();if(r == 0){var list = generateRandomData();var ps = Math.floor(20/s);for(var p = 1;p<s;p++){var portion = list.slice((p-1)*ps,p*ps);send({to:p,data:portion});}var rootPortion = list.slice((s-1)*ps,20);var localSum = rootPortion.reduce((prev,next) => prev+next);recv((data) => {localSum += data;print(''+localSum);});}else{recv({from:0},(data) => {var sum = data.reduce((prev,next) => prev+next);send({to:0,data:sum});});}
