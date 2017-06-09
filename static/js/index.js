var app = angular.module("app", ['nvd3']);

/*
SHOULD REALLY HAVE BUILT THIS IN PYTHON OR EXPORT TO PMML AND IMPORTED, BUT WE WILL WORRY ABOUT THIS WHEN WE HAVE MORE TIME

Coefficients:
                   Estimate Std. Error t value Pr(>|t|)    
(Intercept)        62017.00     218.77 283.478  < 2e-16 ***
Week                -103.19      20.73  -4.977 4.89e-06 ***
Momentummed          677.11     213.60   3.170 0.002312 ** 
Momentumhigh        1264.15     326.63   3.870 0.000252 ***
PrevWinPercCatmid    665.12     181.53   3.664 0.000496 ***
PrevWinPercCathigh   691.58     221.86   3.117 0.002704 ** 
*/



app.controller("AppCtrl", function($scope, $timeout){
	var app = this;
	
	var B_week = {"est":-103.19,"error":20.73};
	var B_momentMed = {"est":677.11,"error":213.60};
	var B_momentHigh = {"est":1264.15,"error":326.63};
	var B_prevSeasonWinMid = {"est":665.12,"error":181.53};
	var B_prevSeasonWinHigh = {"est":691.58,"error":221.86};
	
	$scope.pointEst = "--";
	$scope.staffRatio = "";
	$scope.attendanceRatio = "";
	
	$scope.data3 = null;
	
	$.ajax({
		  url: "/getData",
		  type: "GET",
		  dataType: "xml/html/script/json", // expected format for response
		  contentType: "application/json", // send as JSON
		  //data: JSON.stringify(modelData),
		
		  complete: function(data) {
		    //called when complete
		    console.log("COMPLETE")
		    console.log(data)
		    if(data.status == 200){
			    var data = JSON.parse(data.responseText);
			    console.log(data);
			    $scope.data2 = [data["HomeGames"],data["AwayGames"]];
			    console.log("DATAATA");
			    console.log($scope.data2);
			    
		    }

		  }
		  
		});
	
	$.ajax({
		  url: "/getPieData",
		  type: "GET",
		  dataType: "xml/html/script/json", // expected format for response
		  contentType: "application/json", // send as JSON
		  //data: JSON.stringify(modelData),
		
		  complete: function(data) {
		    //called when complete
		    console.log("COMPLETE")
		    console.log(data)
		    if(data.status == 200){
			    var data = JSON.parse(data.responseText);
			    console.log(data);

			    pieArray = []
			    for(key in data){
				    pieArray.push(data[key]);
			    }
			    
			    $scope.pieData = pieArray;
		    }

		  }
		  
		});
	
	$.ajax({
		  url: "/getBarChartData",
		  type: "GET",
		  dataType: "xml/html/script/json", // expected format for response
		  contentType: "application/json", // send as JSON
		  //data: JSON.stringify(modelData),
		
		  complete: function(data) {
		    //called when complete
		    console.log("Bar Chart complete")
		    console.log(data)
		    if(data.status == 200){
			    var data = JSON.parse(data.responseText);
			    console.log(data);
			    console.log($scope.barData);
			    dataArray = []
			    dataArray.push(data);
			    console.log(dataArray);
			    
			    
			    $scope.barChartData = dataArray;
		    }

		  }
		  
		});
	
	
	
	
	$scope.computeModel = function(){
		$scope.pointEst = "--";
		/*
		var modelData = {"week": 8,
					  	  "momentum": "medPrevWin",
					  	  "lastSeason": "highGames"}
		*/
		
		var modelData = {"week": $scope.weekNumber,
					  	  "momentum": $scope.win,
					  	  "lastSeason": $scope.games,
					  	  "staffRatio": $scope.staffRatio,
					  	  "attendanceRatio": $scope.attendanceRatio}
		
		if($scope.staffRatio == "" || $scope.attendanceRatio ==""){
			alert("The Staff : Attendance Ratio needs to be set in order to process the model.");
			return;
		}
		
		if($scope.weekNumber < 0 || $scope.weekNumber > 17 || $scope.weekNumber == undefined){
			alert("Week number must be between 0 and 17");
			return;
		}
		if($scope.win == undefined || $scope.games == undefined){
			alert("Please make sure to select all options for the model to compute");
			return;
		}
		
		if($scope.games == "medGames"){
			if($scope.weekNumber < 4){
				console.log("LJ");
				alert("Oops, you can't have 4-6 wins in week " + String($scope.weekNumber) +". Please revise your inputs.");
				return;
			}
		}else if($scope.games == "highGames"){
			if($scope.weekNumber < 7){
				console.log("DDD");
				alert("Oops, you can't have over 7 wins in week " + String($scope.weekNumber) +". Please revise your inputs.")
				return;
			}
		}
		
		$scope.modelOutputData = "";
		$.ajax({
				  url: "/calculateModel",
				  type: "POST",
				  dataType: "xml/html/script/json", // expected format for response
				  contentType: "application/json", // send as JSON
				  data: JSON.stringify(modelData),
				
				  complete: function(data) {
				    //called when complete
				    console.log("COMPLETE")
				    console.log(data)
				    if(data.status == 200){
					    var data = JSON.parse(data.responseText);
					    console.log(data);
					    $scope.pointEst = String(Math.round(data.pointEst)) + " Attendees";
					    console.log($scope.pointEst);
					    
					    console.log("CALCULATED MODEL");
					    console.log(data);
					    $scope.modelOutputOptions.title.text = 'Estimated Staff Needed Distribution';
					    var modelArray = [data];
					    console.log(modelArray);
					    $scope.modelOutputData = modelArray;
				    }

				  }
				  
				});
		
		
	}
	
	$scope.modelOutputOptions = {
            chart: {
                type: 'lineChart',
                height: 450,
                margin : {
                    top: 20,
                    right: 20,
                    bottom: 40,
                    left: 55
                },
                x: function(d){ return d.x; },
                y: function(d){ return d.y; },
                useInteractiveGuideline: false,
                dispatch: {
                    stateChange: function(e){ console.log("stateChange"); },
                    changeState: function(e){ console.log("changeState"); },
                    tooltipShow: function(e){ console.log("tooltipShow"); },
                    tooltipHide: function(e){ console.log("tooltipHide"); }
                },
                xAxis: {
                    axisLabel: 'Staffing Needs'
                },
                yAxis: {
                    axisLabel: '',
                    //tickFormat: function(d){
                    //    return d3.format('.02f')(d);
                    //},
                    axisLabelDistance: -10
                },
                callback: function(chart){
                    //console.log("!!! lineChart callback !!!");
                }
            },
            title: {
                enable: true,
                text: ''
            },
            subtitle: {
                enable: true,
                text: '',
                css: {
                    'text-align': 'center',
                    'margin': '10px 13px 0px 7px'
                }
            },
            /*
            caption: {
                enable: true,
                html: '<b>Figure 1.</b> Lorem ipsum ',
                css: {
                    'text-align': 'justify',
                    'margin': '10px 13px 0px 7px'
                }
            }
            */
        };
    
    /* Chart options */
    $scope.options2 = {
            chart: {
                type: 'multiChart',
                height: 450,
                margin : {
                    top: 20,
                    right: 20,
                    bottom: 65,
                    left: 50
                },
                x: function(d){return d[0];},
                y: function(d){return d[1];},
                showValues: true,
                useInteractiveGuidelines: true,
                valueFormat: function(d){
                    return d3.format(',.1f')(d);
                },
                duration: 1000,
                xAxis: {
                    axisLabel: 'Date',
                    tickFormat: function(d) {
                        return d3.time.format('%x')(new Date(d))
                    },
                    rotateLabels: 30,
                    showMaxMin: false
                },
                yAxis: {
                    axisLabel: 'Voltage (v)',
                    
                    axisLabelDistance: -10
                },
                
                
            },
            title: {
			    enable: true,
			    text: "Attendance Over Time",
			    className: "h4",
			  },
            caption: {
			    enable: true,
			    text: "Click on the Home and Away Games legend to resize and interact with the graph",
			    css: {
			      width: "100%",
			      textAlign: "center",
			      "font-size": "17px"
			    }
			  }
				
        };
        $scope.pieOptions = {
            chart: {
                type: 'pieChart',
                height: 500,
                x: function(d){return d.key;},
                y: function(d){return d.y;},
                showLabels: true,
                duration: 500,
                labelThreshold: 0.01,
                labelSunbeamLayout: true,
                legend: {
                    margin: {
                        top: 5,
                        right: 35,
                        bottom: 5,
                        left: 0
                    }
                }
            },
            title: {
			    enable: true,
			    text: "Attendance by Year",
			    className: "h4",
			  }
        };
        
        
        $scope.barChartType = "gamesPlayed";
        $scope.$watch('barChartType', function() {
	        console.log("Bart chart switched");
	        console.log($scope.barChartData[0].values);
	        if($scope.barChartType != "gamesPlayed"){
		        $scope.barOptions.chart.yAxis.axisLabel = "Percent Won";
		        $scope.barOptions.chart.valueFormat = function(d){return d3.format(',%')(d);};
		        for(i=0;i<$scope.barChartData[0].values.length;i++){
			        $scope.barChartData[0].values[i].value = $scope.barChartData[0].values[i].WinPerc;
		        }
		        
	        }else{
		        $scope.barOptions.chart.yAxis.axisLabel = "Games Played";
		        $scope.barOptions.chart.valueFormat = function(d){return d3.format(',.0f')(d);};
		        for(i=0;i<$scope.barChartData[0].values.length;i++){
			        $scope.barChartData[0].values[i].value = $scope.barChartData[0].values[i].gamesPlayed;
		        }
	        }

	    });
        
        $scope.barOptions = {
            chart: {
                type: 'discreteBarChart',
                height: 450,
                margin : {
                    top: 20,
                    right: 20,
                    bottom: 50,
                    left: 55
                },
                x: function(d){return d.label;},
                y: function(d){return d.value;},
                showValues: true,
                valueFormat: function(d){
                    return d3.format(',.0f')(d);
                },
                duration: 500,
                xAxis: {
                    axisLabel: 'X Axis',
                    rotateLabels: 70,
                    fontSize: 10
                },
                yAxis: {
                    axisLabel: 'Games Played',
                    axisLabelDistance: -10
                }
            },
            title: {
			    enable: true,
			    text: "Opponent Breakdown",
			    className: "h4",
			  }
        };

        $scope.barData = [
            {
                key: "Cumulative Return",
                values: [
                    {
                        "label" : "A" ,
                        "value" : -29.765957771107
                    } ,
                    {
                        "label" : "B" ,
                        "value" : 0
                    } ,
                    {
                        "label" : "C" ,
                        "value" : 32.807804682612
                    } ,
                    {
                        "label" : "D" ,
                        "value" : 196.45946739256
                    } ,
                    {
                        "label" : "E" ,
                        "value" : 0.19434030906893
                    } ,
                    {
                        "label" : "F" ,
                        "value" : -98.079782601442
                    } ,
                    {
                        "label" : "G" ,
                        "value" : -13.925743130903
                    } ,
                    {
                        "label" : "H" ,
                        "value" : -5.1387322875705
                    }
                ]
            }
        ]
        
        /*
        $scope.data2 = [
            {
                "key" : "Quantity" ,
                "color": "#d62728",
                "type": "bar",
                "yAxis": 1,
                //"bar": true,
                "values" : [ [ 1136005200000 , 1271000.0] , [ 1138683600000 , 1271000.0] , [ 1141102800000 , 1271000.0] , [ 1143781200000 , 0] , [ 1146369600000 , 0] , [ 1149048000000 , 0] , [ 1151640000000 , 0] , [ 1154318400000 , 0] , [ 1156996800000 , 0] , [ 1159588800000 , 3899486.0] , [ 1162270800000 , 3899486.0] , [ 1164862800000 , 3899486.0] , [ 1167541200000 , 3564700.0] , [ 1170219600000 , 3564700.0] , [ 1172638800000 , 3564700.0] , [ 1175313600000 , 2648493.0] , [ 1177905600000 , 2648493.0] , [ 1180584000000 , 2648493.0] , [ 1183176000000 , 2522993.0] , [ 1185854400000 , 2522993.0] , [ 1188532800000 , 2522993.0] , [ 1191124800000 , 2906501.0] , [ 1193803200000 , 2906501.0] , [ 1196398800000 , 2906501.0] , [ 1199077200000 , 2206761.0] , [ 1201755600000 , 2206761.0] , [ 1204261200000 , 2206761.0] , [ 1206936000000 , 2287726.0] , [ 1209528000000 , 2287726.0] , [ 1212206400000 , 2287726.0] , [ 1214798400000 , 2732646.0] , [ 1217476800000 , 2732646.0] , [ 1220155200000 , 2732646.0] , [ 1222747200000 , 2599196.0] , [ 1225425600000 , 2599196.0] , [ 1228021200000 , 2599196.0] , [ 1230699600000 , 1924387.0] , [ 1233378000000 , 1924387.0] , [ 1235797200000 , 1924387.0] , [ 1238472000000 , 1756311.0] , [ 1241064000000 , 1756311.0] , [ 1243742400000 , 1756311.0] , [ 1246334400000 , 1743470.0] , [ 1249012800000 , 1743470.0] , [ 1251691200000 , 1743470.0] , [ 1254283200000 , 1519010.0] , [ 1256961600000 , 1519010.0] , [ 1259557200000 , 1519010.0] , [ 1262235600000 , 1591444.0] , [ 1264914000000 , 1591444.0] , [ 1267333200000 , 1591444.0] , [ 1270008000000 , 1543784.0] , [ 1272600000000 , 1543784.0] , [ 1275278400000 , 1543784.0] , [ 1277870400000 , 1309915.0] , [ 1280548800000 , 1309915.0] , [ 1283227200000 , 1309915.0] , [ 1285819200000 , 1331875.0] , [ 1288497600000 , 1331875.0] , [ 1291093200000 , 1331875.0] , [ 1293771600000 , 1331875.0] , [ 1296450000000 , 1154695.0] , [ 1298869200000 , 1154695.0] , [ 1301544000000 , 1194025.0] , [ 1304136000000 , 1194025.0] , [ 1306814400000 , 1194025.0] , [ 1309406400000 , 1194025.0] , [ 1312084800000 , 1194025.0] , [ 1314763200000 , 1244525.0] , [ 1317355200000 , 475000.0] , [ 1320033600000 , 475000.0] , [ 1322629200000 , 475000.0] , [ 1325307600000 , 690033.0] , [ 1327986000000 , 690033.0] , [ 1330491600000 , 690033.0] , [ 1333166400000 , 514733.0] , [ 1335758400000 , 514733.0]]
            }];
    console.log("LOaded stuff");
    console.log($scope.data2);
	console.log($scope.data2[0]['values'][0]);
	*/
	//This is used so that the seconds continue to increment in the time since request column
	function fireDigestEverySecond(request) {
    	$timeout(fireDigestEverySecond , 1000);
    	/*
    	for(i=0; i< $scope.data2[0]['values'].length; i++){
    		var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
	    	$scope.data2[0]['values'][i][1] += (100000 * Math.floor((Math.random() * 10) + 1)) ;
	    	
    	}
    	*/
    	//console.log($scope.pointEst);
    	
    };
    fireDigestEverySecond();
	  
		
})

.directive('barChart', function(){
            var chart = d3.custom.barChart();
            return {
                restrict: 'E',
                replace: true,
                template: '<div class="chart"></div>',
                scope:{
                    height: '=height',
                    data: '=data',
                    hovered: '&hovered'
                },
                link: function(scope, element, attrs) {
                    var chartEl = d3.select(element[0]);
                    chart.on('customHover', function(d, i){
                        scope.hovered({args:d});
                    });

                    scope.$watch('data', function (newVal, oldVal) {
                        chartEl.datum(newVal).call(chart);
                    });

                    scope.$watch('height', function(d, i){
                        chartEl.call(chart.height(scope.height));
                    })
                }
            }
        })