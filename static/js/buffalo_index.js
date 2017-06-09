var app = angular.module("app", ['nvd3','rzModule']);

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
	/*
	var B_week = {"est":-103.19,"error":20.73};
	var B_momentMed = {"est":677.11,"error":213.60};
	var B_momentHigh = {"est":1264.15,"error":326.63};
	var B_prevSeasonWinMid = {"est":665.12,"error":181.53};
	var B_prevSeasonWinHigh = {"est":691.58,"error":221.86};
	*/
	$scope.pointEst = "--";
	$scope.staffRatio = "";
	$scope.attendanceRatio = "";
	
	$scope.data3 = null;
	
	$.ajax({
		  url: "/buffalo/getData",
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
		  url: "/buffalo/getPieData",
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
		  url: "/buffalo/getBarChartData",
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
			if($scope.weekNumber < 3){
				console.log("LJ");
				alert("Oops, you can't have 3-5 wins in week " + String($scope.weekNumber) +". Please revise your inputs.");
				return;
			}
		}else if($scope.games == "highGames"){
			if($scope.weekNumber < 5){
				console.log("DDD");
				alert("Oops, you can't have over 5 wins in week " + String($scope.weekNumber) +". Please revise your inputs.")
				return;
			}
		}
		
		$scope.modelOutputData = "";
		$.ajax({
				  url: "/buffalo/calculateModel",
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
	
	//INITIALIZING SWITCH VARIABLES
	//Services
	$scope.software = "less";
	$scope.softwareBuildingOptions = {floor: 20, ceil: 40};
    $scope.monitoringBuildingHours = 6;
    $scope.softwareBuildingHours = 30 + $scope.monitoringBuildingHours;
    $scope.monitoringFraction = $scope.monitoringBuildingHours / $scope.softwareBuildingHours;
    
    $scope.interfacesFraction = (1 - ($scope.monitoringBuildingHours / $scope.softwareBuildingHours)) * .85;
    $scope.integrationFraction = (1 - ($scope.monitoringBuildingHours / $scope.softwareBuildingHours)) * .15;
	//Maintenance
	$scope.modelMonitoring = 6;
	$scope.softwareMaintenance = 2;
	
	
	
	
	
	$scope.modelBuildingHours = 170;
	$scope.modelBuildingOptions = {floor: 80, ceil: 1000};
	
	
	
	
	
	$scope.modelBuildingPerc = {"discovery":{"total":.15,"DS":1},"etl":{"total":.55,"DS":.3,"DE":.7},"modeling":{"total":.2,"DS":.9,"DE":.1},"reporting":{"total":.1,"DS":.8,"CW":.2}};
	
	$scope.softwareBuildingPerc = {"interfaces":{"total":$scope.interfacesFraction,"BD":.6,"FD":.3,"GD":.1},"integration":{"total":$scope.integrationFraction,"BD":.3,"DE":.5,"FD":.2},"monitoring":{"total":$scope.monitoringFraction,"DE":.7,"BD":.15,"DS":.15}}
	
	
	
	$scope.$watch('software', function() {
        if($scope.software == "less"){
        	//software 
	        $scope.softwareBuildingOptions = {floor: 20, ceil: 40};
	        $scope.monitoringBuildingHours = 6;
	        $scope.softwareBuildingHours = 30 + $scope.monitoringBuildingHours;
	        $scope.monitoringFraction = $scope.monitoringBuildingHours / $scope.softwareBuildingHours;
	        $scope.interfacesFraction = (1 - ($scope.monitoringBuildingHours / $scope.softwareBuildingHours)) * .85;
	        $scope.integrationFraction = (1 - ($scope.monitoringBuildingHours / $scope.softwareBuildingHours)) * .15;
	        
	        //maintenance
	        $scope.modelMonitoring = 6;
	        $scope.softwareMaintenance = 2;
        }else{
        	//software
	        $scope.softwareBuildingOptions = {floor: 80, ceil: 1700};
	        $scope.monitoringBuildingHours = 30;
	        $scope.softwareBuildingHours = 130 + $scope.monitoringBuildingHours;
	        $scope.monitoringFraction = $scope.monitoringBuildingHours / $scope.softwareBuildingHours;
	        $scope.interfacesFraction = (1 - ($scope.monitoringBuildingHours / $scope.softwareBuildingHours)) * .85;
	        $scope.integrationFraction = (1 - ($scope.monitoringBuildingHours / $scope.softwareBuildingHours)) * .15;
	        
	        //maintenance
	        $scope.modelMonitoring = 6;
	        $scope.softwareMaintenance = 6;
	        
        }
    });
	
	
	
	
	
	
	
	
	$scope.maintenancePerc = {"modelMaint":{"total":($scope.modelMonitoring/($scope.modelMonitoring + $scope.softwareMaintenance)),"DS":1},"softMaint":{"total":($scope.softwareMaintenance/($scope.modelMonitoring + $scope.softwareMaintenance)),"FD":.5,"BD":.5}}
	
    
    function drawData(){
	    $scope.sunburstData = [{
            "name": "Services",
            "children": [
                {
                    "name": "Model Building",
                    "size": "80-300 hours",
                    "children": [
                        {
                            "name": "1.) Discovery",
                            "children": [
                                {"name": "Data Scientist", "size": $scope.modelBuildingHours * $scope.modelBuildingPerc.discovery.total * $scope.modelBuildingPerc.discovery.DS},
                            ]
                        },
                        {
                            "name": "2.) Data ETL",
                            "children": [
                                {"name": "Data Scientist ", "size": $scope.modelBuildingHours * $scope.modelBuildingPerc.etl.total * $scope.modelBuildingPerc.etl.DS},
                                {"name": "Data Engineer ", "size": $scope.modelBuildingHours * $scope.modelBuildingPerc.etl.total * $scope.modelBuildingPerc.etl.DE}
                            ]
                        },
                        {
                            "name": "3.) Modeling and Insight Extraction",
                            "children": [
                                {"name": "Data Scientist  ", "size": $scope.modelBuildingHours * $scope.modelBuildingPerc.modeling.total * $scope.modelBuildingPerc.modeling.DS},
                                {"name": "Data Engineer  ", "size": $scope.modelBuildingHours * $scope.modelBuildingPerc.modeling.total * $scope.modelBuildingPerc.modeling.DE}
                            ]
                        },
                        {
                            "name": "4.) Report / Presentations",
                            "children": [
                                {"name": "Data Scientistc   ", "size": $scope.modelBuildingHours * $scope.modelBuildingPerc.reporting.total * $scope.modelBuildingPerc.reporting.DS},
                                {"name": "Copy Writer", "size": $scope.modelBuildingHours * $scope.modelBuildingPerc.reporting.total * $scope.modelBuildingPerc.reporting.CW}
                            ]
                        }]
               }
               ,
               {     "name": "Custom Software",
               		  "size": "30-1600 hours",
               		  "children": [
               		  	  {"name": "1.) Software Interface",
               		  	  "children":[
               		  	  	  {"name": "Backend Developer", "size":$scope.softwareBuildingHours * $scope.softwareBuildingPerc.interfaces.total * $scope.softwareBuildingPerc.interfaces.BD},
               		  	  	  {"name": "Frontend Developer", "size":$scope.softwareBuildingHours * $scope.softwareBuildingPerc.interfaces.total * $scope.softwareBuildingPerc.interfaces.FD},
               		  	  	  {"name": "Graphic Designer", "size":$scope.softwareBuildingHours * $scope.softwareBuildingPerc.interfaces.total * $scope.softwareBuildingPerc.interfaces.GD}
               		  	  	  ]
               		  	  },
               		  	  {"name": "2.) Model Integration",
	               		  	  "children":[
	               		  	  		{"name": " Backend Developer", "size":$scope.softwareBuildingHours * $scope.softwareBuildingPerc.integration.total * $scope.softwareBuildingPerc.integration.BD},
	               		  	  	  {"name": " Data Engineer", "size":$scope.softwareBuildingHours * $scope.softwareBuildingPerc.integration.total * $scope.softwareBuildingPerc.integration.DE},
	               		  	  	  {"name": " Frontend Developer", "size":$scope.softwareBuildingHours * $scope.softwareBuildingPerc.integration.total * $scope.softwareBuildingPerc.integration.FD}
	               		  	  ]
               		  	  },
               		  	  {"name": "3.) Model Monitoring Infrastructure",
	               		  	  "children":[
	               		  	  		{"name": "  Backend Developer", "size":$scope.softwareBuildingHours * $scope.softwareBuildingPerc.monitoring.total * $scope.softwareBuildingPerc.monitoring.BD},
	               		  	  	  {"name": "  Data Engineer", "size":$scope.softwareBuildingHours * $scope.softwareBuildingPerc.monitoring.total * $scope.softwareBuildingPerc.monitoring.DE},
	               		  	  	  {"name": "  Data Scientist", "size":$scope.softwareBuildingHours * $scope.softwareBuildingPerc.monitoring.total * $scope.softwareBuildingPerc.monitoring.DS}
	               		  	  ]
               		  	  }
               		  ]
               }]
           }]
        
        
        $scope.sunburstSmallData = [{
	    "name": "Recurring Maintance Hours",
	    "children": [
	    	{"name": "Model Maintenance",
	    		"children":[
	    			{"name": " Data Scientist ", "size":$scope.modelMonitoring}
	    		]
	    	},
	    	{"name": "Software Maintenance",
		    	"children":[
		    		{"name": " Fronted Developer ", "size":$scope.softwareMaintenance / 2},
		    		{"name": " Backend Developer ", "size":$scope.softwareMaintenance / 2}
		    	]
	    	}
	    ]
    }]
        
    }
    
    
    
	$scope.$watch('modelBuildingHours', function() {
        drawData();
    });
    
    $scope.$watch('softwareBuildingHours', function() {
        drawData();
    });
	
	drawData();
	
	$scope.sunburstOptions = {
  "chart": {
    "type": "sunburstChart",
    "height": 450,
    "duration": 250,
    "dispatch": {},
    "sunburst": {
      "dispatch": {},
      //"width": 600,
      "height": 600,
      "mode": "size",
      "id": 7567,
      "duration": 500,
      "groupColorByParent": true,
      "showLabels": true,
      "labelThreshold": 0.02,
      "margin": {
        "top": 0,
        "right": 0,
        "bottom": 0,
        "left": 0
      }
    },
    "tooltip": {
      "duration": 0,
      "gravity": "w",
      "distance": 25,
      "snapDistance": 0,
      "classes": null,
      "valueFormatter": function (d){return Math.round(d);},
      "chartContainer": null,
      "enabled": true,
      "hideDelay": 200,
      "headerEnabled": false,
      "fixedTop": null,
      "offset": {
        "left": 0,
        "top": 0
      },
      "hidden": true,
      "data": null,
      "id": "nvtooltip-73637"
    },
    //"width": 600,
    "mode": "size",
    "groupColorByParent": true,
    "showLabels": false,
    "labelThreshold": 0.1,
    "margin": {
      "top": 30,
      "right": 20,
      "bottom": 20,
      "left": 20
    },
    "noData": null,
    "defaultState": null
  },
  "title": {
    "enable": true,
    "text": "Services Breakdown",
    "className": "h4",
    "css": {
    //  "width": "600px",
      "textAlign": "left",
    //  "font-size": "30px"
    }
  },
  "subtitle": {
    "enable": true,
    "text": "This Sunburst chart shows the breakdown of hours by task and type of worker based on the set slider information. Adjust the above slider information to see how the hours adjust based on how robust one wants to go into modeling or software.",
    
    "css": {
      //"width": "600px",
      "textAlign": "left",
    }
    
  },
  "caption": {
    "enable": false,
    "text": "This Sunburst chart shows the breakdown of hours by task and type of worker based on the set slider information. Adjust the above slider information to see how the hours adjust based on how robust one wants to go into modeling or software.",
    /*
    "css": {
      "width": "600px",
      "textAlign": "center",
      "font-size": "15px"
    }
    */
  },
  "styles": {
    "classes": {
      "with-3d-shadow": true,
      "with-transitions": true,
      "gallery": false
    },
    "css": {}
  }
}
	
	$scope.sunburstSmallOptions = {
  "chart": {
    "type": "sunburstChart",
    "height": 225,
    "duration": 250,
    "dispatch": {},
    "sunburst": {
      "dispatch": {},
      //"width": 600,
      "height": 600,
      "mode": "size",
      "id": 7567,
      "duration": 500,
      "groupColorByParent": true,
      "showLabels": true,
      "labelThreshold": 0.02,
      "margin": {
        "top": 0,
        "right": 0,
        "bottom": 0,
        "left": 0
      }
    },
    "tooltip": {
      "duration": 0,
      "gravity": "w",
      "distance": 25,
      "snapDistance": 0,
      "classes": null,
      "valueFormatter": function (d){return Math.round(d);},
      "chartContainer": null,
      "enabled": true,
      "hideDelay": 200,
      "headerEnabled": false,
      "fixedTop": null,
      "offset": {
        "left": 0,
        "top": 0
      },
      "hidden": true,
      "data": null,
      "id": "nvtooltip-73637"
    },
    //"width": 600,
    "mode": "size",
    "groupColorByParent": true,
    "showLabels": false,
    "labelThreshold": 0.1,
    "margin": {
      "top": 30,
      "right": 20,
      "bottom": 20,
      "left": 20
    },
    "noData": null,
    "defaultState": null
  },
  "title": {
    "enable": true,
    "text": "Maintenance Breakdown",
    "className": "h4",
    
    "css": {
      //"width": "600px",
      "textAlign": "left",
      //"font-size": "30px"
    }
    
  },
  "subtitle": {
    "enable": true,
    "text": "This shows the maintenance areas for the give options. This is proportional to the size of the original contract.",
    
    "css": {
      //"width": "600px",
      "textAlign": "left",
    }
    
  },
  "caption": {
    "enable": false,
    "text": "This shows the maintenance areas for the give options. This is proportional to the size of the original contract.",
    /*
    "css": {
      "width": "600px",
      "textAlign": "center",
      "font-size": "15px"
    }
    */
  },
  "styles": {
    "classes": {
      "with-3d-shadow": true,
      "with-transitions": true,
      "gallery": false
    },
    "css": {}
  }
}
	
	
	
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




$(document).ready(function() {
	
	
	
	
	
	
	
})

