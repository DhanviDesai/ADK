//var data = []
var childProcess = require('child_process');
var ctx =   document.getElementById('extraGraph').getContext('2d');

var chartObjects = [];

//whenever a new node connects, I will create a new chartObject and push it in an Array

//Depending on the id of the node that I am getting the data, I will draw and update the chart

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
    options:{
      legend:{
        display:false
      }
    }
  });
  setTimeout(() => {
    drawChart();
  },820);
}

function drawChart(){
  var cp1 = childProcess.exec("vmstat | sed -n '3p' | awk '{print $4,$5,$6}'",(err,stdout,stderr) => {
    var resourceLine = stdout;
    var resources = resourceLine.split(" ");
    var free = parseInt(resources[0]);
    var buff = parseInt(resources[1]);
    var cache = parseInt(resources[2]);
    var labels = ['free','buff','cache'];
    var dataList = [];
    dataList.push(free);
    dataList.push(buff);
    dataList.push(cache);
    handleUpdate(myDoughnutChart,labels,dataList);
  });
  setTimeout(() => {
    drawChart();
  },1000);
}


firstChart();
