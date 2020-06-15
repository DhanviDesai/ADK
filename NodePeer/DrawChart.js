var childProcess = require('child_process');
var ctx = document.getElementById("myChart").getContext('2d');

function handleUpdate(chart,label,data){
  chart.data.datasets.forEach((dataset, i) => {
    dataset.data.pop();
    dataset.data.pop();
    dataset.data.pop();
  });
  chart.data.datasets.forEach((dataset, i) => {
    dataset.data.push(data[0]);
    dataset.data.push(data[1]);
    dataset.data.push(data[2]);
  });
  chart.update(0);
}
var myDoughnutChart;
function firstChart(){
  myDoughnutChart = new Chart(ctx,{
    type:'doughnut',
    data:{
      datasets:[{
        data:[10,20,30],
        backgroundColor:[
          'rgba( 125, 206, 160 ,1)',
          'rgba( 244, 208, 63 ,1)',
          'rgba( 243, 156, 18 ,1)'
        ]
      }],
      labels:[
        'free',
        'buff',
        'cache'
      ]
    },
  });
  setTimeout(() => {
    drawChart();
  },820);
}

var dataList = [];

function drawChart(){
  var cp1 = childProcess.exec("vmstat | sed -n '3p' | awk '{print $4,$5,$6}'",(err,stdout,stderr) => {
    var resourceLine = stdout;
    var resources = resourceLine.split(" ");
    var free = parseInt(resources[0]);
    var buff = parseInt(resources[1]);
    var cache = parseInt(resources[2]);
    var labels = ['free','buff','cache'];
    dataList = [];
    dataList.push(free);
    dataList.push(buff);
    dataList.push(cache);
    handleUpdate(myDoughnutChart,labels,dataList);
  });
  setTimeout(() => {
    drawChart();
  },3000);
}


function sendItToAll(){
  getMyIdWait((id) => {
    var peerList = getDirectPeerObjectList();
    var data = {
      type:'Resources',
      id:id,
      data:dataList
    }
    peerList.forEach((peer, i) => {
      peer.send(JSON.stringify(data));
    });


    setTimeout(() => {
      sendItToAll();
    },3000);
  });

}

firstChart();
sendItToAll();
