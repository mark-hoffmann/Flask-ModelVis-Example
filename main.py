from flask import Flask, render_template, request, jsonify
import simplejson as json
import json
import os

from scipy.stats import norm
import numpy as np
import pandas as pd

from datetime import datetime

app = Flask(__name__)




@app.route('/')
def index():
    return render_template('index.html')

dfHome = pd.read_csv('data/HomeAttendance.csv')
dfAway = pd.read_csv('data/AwayAttendance.csv')

@app.route('/getData', methods=['GET'])
def getData():
	try:
		
		
		
		homeValues = []
		awayValues = []
		epoch = datetime.utcfromtimestamp(0)
		for i in range(0,len(dfHome)):
			d = datetime.strptime(dfHome.loc[i]["Date2"], "%Y-%m-%d")
			javaTime = (d - epoch).total_seconds() * 1000
			homeValues.append([javaTime,float(dfHome.loc[i]["Attendance"])])
		
		for i in range(0,len(dfAway)):
			d = datetime.strptime(dfAway.loc[i]["Date2"], "%Y-%m-%d")
			javaTime = (d - epoch).total_seconds() * 1000
			awayValues.append([javaTime,float(dfAway.loc[i]["Attendance"])])
		
		
		formatted = {"HomeGames":{"key":"HomeGames","color":"#ff0404","type":"line","yAxis":1,"values":homeValues},
					 "AwayGames":{"key":"AwayGames","color":"#0012ff","type":"line","yAxis":1,"values":awayValues}}
		
		#print(formatted)
		#print(dfHome.head(5))
	except Exception as e:
		print("ERERER")
		print(e)
		
	
	return(jsonify(formatted))
	

@app.route('/getPieData',methods=["GET"])
def getPieData():
	
	pieData = dfHome.groupby(['Year'])[["Attendance"]].sum()
	
	formatted = {}
	for i in range(0,len(pieData)):
		formatted.update({int(pieData.index[i]):{"key":int(pieData.index[i]),"y":int(pieData.iloc[i])}})

	
	return(jsonify(formatted))
	

@app.route('/getBarChartData',methods=["GET"])
def getBarChartData():
	
	try:
		#concatenate home and away
		games = pd.concat([dfHome,dfAway])
		print("concatted")
		games.loc[games["Win"] == "W", "WinsBinary"] = int(1)
		games.loc[games["Win"] != "W", "WinsBinary"] = int(0)
		print("codedWinsBinary")
		teamsSum = games.groupby(["Opponent"])[["WinsBinary"]].sum()
		teamsCount = games.groupby(["Opponent"])[["Win"]].count()
		teamsTotal = teamsSum.merge(teamsCount,left_index=True, right_index=True, how="inner")
		
		teamsTotal["WinPerc"] = teamsTotal["WinsBinary"] / teamsTotal["Win"]
		
		
		dataArray = []
		for i in range(0,len(teamsTotal)):
			dataArray.append({"label":teamsTotal.index[i],"gamesPlayed":int(teamsTotal.iloc[i]["Win"]),"WinPerc":float(teamsTotal.iloc[i]["WinPerc"]),"value":int(teamsTotal.iloc[i]["Win"])})
			#formatted.update({teamsTotal.index[i]:{"key":teamsTotal.index[i],"values":{"gamesPlayed":int(teamsTotal.iloc[i]["Win"]),"WinPerc":float(teamsTotal.iloc[i]["WinPerc"]),"value":int(teamsTotal.iloc[i]["Win"])}}})
		
		formatted = {"key":"Opponent Breakdown","values":dataArray}
		
		
	except Exception as e:
		print(e)
	
	
	return(jsonify(formatted))
	
	






@app.route('/getParameterDistributions', methods=['POST'])
def getParamDists():
	try:
		stdevsOut = 4.5
		paramArray = [intercept, B_week, B_momentMed, B_momentHigh, B_prevSeasonWinMid, B_prevSeasonWinHigh]
		finalOutput = {}
		
		for param in paramArray:
			x = np.linspace(param["est"] - stdevsOut * param["error"], param["est"] + stdevsOut * param["error"], 1000)
			y = norm.pdf(x, loc=param["est"], scale=param["error"])
			
			valuesOut = []
			for i in xrange(0,len(x)):
				valuesOut.append([x[i],y[i]])
			
			finalOutput[param["name"]] = {"est":param["est"], "error":param["error"], "values":valuesOut}
	
	
	except Exception as e:
		print("ERROR")
		print(e)
	
	return(jsnoify(finalOutput))




@app.route('/calculateModel', methods=['POST'])
def calculateModel():

	intercept = {"est":62017,"error":20.73, "name":"intercept"}
	B_week = {"est":-103.19,"error":20.73, "name":"week"}
	B_momentMed = {"est":677.11,"error":213.60, "name":"Medium Momentum"}
	B_momentHigh = {"est":1264.15,"error":326.63, "name":"High Momentum"}
	B_prevSeasonWinMid = {"est":665.12,"error":181.53, "name":"Medium Previous Season Win %"}
	B_prevSeasonWinHigh = {"est":691.58,"error":221.86, "name":"High Previous Season Win %"}
	
	try:
		data = request.json
		week = data.get("week")
		momentum = data.get("momentum")
		lastSeason = data.get("lastSeason")
		staffRatio = data.get("staffRatio")
		attendanceRatio = data.get("attendanceRatio")
		
		staffMult = attendanceRatio / staffRatio
		
		X_week = week;
		X_momentMed = 0;
		X_momentHigh = 0;
		X_prevSeasonWinMid = 0;
		X_prevSeasonWinHigh = 0;
		
		vals = {"pointEst":0,"distribution":[]}
		
		probRange = [0,1]
		
		if momentum == "medGames":
			X_momentMed = 1
		elif momentum == "highGames":
			X_momentHigh = 1
		
		if lastSeason == "medPrevWin":
			X_prevSeasonWinMid = 1
		elif lastSeason =="highPrevWin":
			X_prevSeasonWinHigh = 1
		
		print(B_week["est"])
		
		outputEst = intercept["est"] + B_week["est"] * X_week + B_momentMed["est"] * X_momentMed + B_momentHigh["est"] * X_momentHigh + B_prevSeasonWinMid["est"] * X_prevSeasonWinMid + B_prevSeasonWinHigh["est"] * X_prevSeasonWinHigh
		
		stdevsOut = 4.5
		x = np.linspace(outputEst - stdevsOut * 490, outputEst + stdevsOut * 490, 600)
		y = norm.pdf(x, loc=outputEst, scale=490)
		
		valueArray = []
		for i in range(0,len(x)):
			valueArray.append({"x":x[i] / staffMult,"y":y[i]})
		
		
		print(outputEst)
	except Exception as e:
		print("ERROR")
		print(e)
	

	return(jsonify({"pointEst":outputEst,"values":valueArray, "key":"Expected Staffing Needs", "color":"#7777ff", "area":True}))








'''
                   Estimate Std. Error t value Pr(>|t|)    
(Intercept)         67118.1     2363.8  28.394  < 2e-16 ***
Week                 -946.8      368.0  -2.573  0.01292 *  
PrevWinPercCatmid    4030.6     1908.6   2.112  0.03944 *  
PrevWinPercCathigh   6195.6     2472.8   2.506  0.01533 *  
Lag1Win              1977.7     1199.5   1.649  0.10511    
Lag2Win              1232.9     1343.7   0.918  0.36304    
Momentummed          2379.9     2020.7   1.178  0.24416    
Momentumhigh         7930.7     2573.5   3.082  0.00326 ** 
WeekGroupmiddle      3307.7     2893.0   1.143  0.25802    
WeekGrouplate        2075.0     4600.2   0.451  0.65379   
'''



@app.route('/buffalo')
def buffalo_index():
    return render_template('buffalo_index.html')

dfHome_buff = pd.read_csv('data/buffaloHome.csv')
dfAway_buff = pd.read_csv('data/buffaloAway.csv')

@app.route('/buffalo/getData', methods=['GET'])
def buffao_getData():
	
	dfHome_buff = pd.read_csv('data/buffaloHome.csv')
	dfAway_buff = pd.read_csv('data/buffaloAway.csv')
	
	dfHome_buff['Date3'] =  pd.to_datetime(dfHome_buff['Date2'], format='%Y-%m-%d')
	dfAway_buff['Date3'] =  pd.to_datetime(dfAway_buff['Date2'], format='%Y-%m-%d')
	
	
	dfHome_buff = dfHome_buff.sort_values(by="Date3")
	dfAway_buff = dfAway_buff.sort_values(by="Date3")
	dfHome_buff = dfHome_buff.reset_index(drop=True)
	dfAway_buff = dfAway_buff.reset_index(drop=True)
	#print("Date333")
	#print(dfHome_buff)
	
	homeValues = []
	awayValues = []
	epoch = datetime.utcfromtimestamp(0)
	for i in range(0,len(dfHome_buff)):
		#print(dfHome_buff.loc[i]["Date2"])
		d = datetime.strptime(dfHome_buff.loc[i]["Date2"], "%Y-%m-%d")
		javaTime = (d - epoch).total_seconds() * 1000
		homeValues.append([javaTime,float(dfHome_buff.loc[i]["Attendance"])])
	
	for i in range(0,len(dfAway_buff)):
		d = datetime.strptime(dfAway_buff.loc[i]["Date2"], "%Y-%m-%d")
		javaTime = (d - epoch).total_seconds() * 1000
		awayValues.append([javaTime,float(dfAway_buff.loc[i]["Attendance"])])
	
	
	formatted = {"HomeGames":{"key":"HomeGames","color":"#ff0404","type":"line","yAxis":1,"values":homeValues},
				 "AwayGames":{"key":"AwayGames","color":"#0012ff","type":"line","yAxis":1,"values":awayValues}}
	
	#print(formatted)
	#print(dfHome.head(5))
	
		
	
	return(jsonify(formatted))
	

@app.route('/buffalo/getPieData',methods=["GET"])
def buffalo_getPieData():
	
	pieData = dfHome_buff.groupby(['Year'])[["Attendance"]].sum()
	
	formatted = {}
	for i in range(0,len(pieData)):
		formatted.update({int(pieData.index[i]):{"key":int(pieData.index[i]),"y":int(pieData.iloc[i])}})

	
	return(jsonify(formatted))
	

@app.route('/buffalo/getBarChartData',methods=["GET"])
def buffalo_getBarChartData():
	
	try:
		#concatenate home and away
		games = pd.concat([dfHome_buff,dfAway_buff])
		print("concatted")
		games.loc[games["Win"] == "W", "WinsBinary"] = int(1)
		games.loc[games["Win"] != "W", "WinsBinary"] = int(0)
		print("codedWinsBinary")
		teamsSum = games.groupby(["Opponent"])[["WinsBinary"]].sum()
		teamsCount = games.groupby(["Opponent"])[["Win"]].count()
		teamsTotal = teamsSum.merge(teamsCount,left_index=True, right_index=True, how="inner")
		
		teamsTotal["WinPerc"] = teamsTotal["WinsBinary"] / teamsTotal["Win"]
		
		
		dataArray = []
		for i in range(0,len(teamsTotal)):
			dataArray.append({"label":teamsTotal.index[i],"gamesPlayed":int(teamsTotal.iloc[i]["Win"]),"WinPerc":float(teamsTotal.iloc[i]["WinPerc"]),"value":int(teamsTotal.iloc[i]["Win"])})
			#formatted.update({teamsTotal.index[i]:{"key":teamsTotal.index[i],"values":{"gamesPlayed":int(teamsTotal.iloc[i]["Win"]),"WinPerc":float(teamsTotal.iloc[i]["WinPerc"]),"value":int(teamsTotal.iloc[i]["Win"])}}})
		
		formatted = {"key":"Opponent Breakdown","values":dataArray}
		
		
	except Exception as e:
		print(e)
	
	
	return(jsonify(formatted))
	
	
'''
                   Estimate Std. Error t value Pr(>|t|)    
(Intercept)         67118.1     2363.8  28.394  < 2e-16 ***
Week                 -946.8      368.0  -2.573  0.01292 *  
PrevWinPercCatmid    4030.6     1908.6   2.112  0.03944 *  
PrevWinPercCathigh   6195.6     2472.8   2.506  0.01533 *     
Momentummed          2379.9     2020.7   1.178  0.24416    
Momentumhigh         7930.7     2573.5   3.082  0.00326 ** 
'''





@app.route('/buffalo/getParameterDistributions', methods=['POST'])
def buffalo_getParamDists():
	try:
		stdevsOut = 4.5
		paramArray = [intercept, B_week, B_momentMed, B_momentHigh, B_prevSeasonWinMid, B_prevSeasonWinHigh]
		finalOutput = {}
		
		for param in paramArray:
			x = np.linspace(param["est"] - stdevsOut * param["error"], param["est"] + stdevsOut * param["error"], 1000)
			y = norm.pdf(x, loc=param["est"], scale=param["error"])
			
			valuesOut = []
			for i in xrange(0,len(x)):
				valuesOut.append([x[i],y[i]])
			
			finalOutput[param["name"]] = {"est":param["est"], "error":param["error"], "values":valuesOut}
	
	
	except Exception as e:
		print("ERROR")
		print(e)
	
	return(jsnoify(finalOutput))




@app.route('/buffalo/calculateModel', methods=['POST'])
def buffalo_calculateModel():

	intercept = {"est":67118.1,"error":2363.8, "name":"intercept"}
	B_week = {"est":-946.8,"error":368.0, "name":"week"}
	B_momentMed = {"est":2379.9,"error":2020.7, "name":"Medium Momentum"}
	B_momentHigh = {"est":7930.7,"error":2573.5, "name":"High Momentum"}
	B_prevSeasonWinMid = {"est":4030.6,"error":1908.6, "name":"Medium Previous Season Win %"}
	B_prevSeasonWinHigh = {"est":6195.6,"error":2472.8, "name":"High Previous Season Win %"}
	
	try:
		data = request.json
		week = data.get("week")
		momentum = data.get("momentum")
		lastSeason = data.get("lastSeason")
		staffRatio = data.get("staffRatio")
		attendanceRatio = data.get("attendanceRatio")
		
		staffMult = attendanceRatio / staffRatio
		
		X_week = week;
		X_momentMed = 0;
		X_momentHigh = 0;
		X_prevSeasonWinMid = 0;
		X_prevSeasonWinHigh = 0;
		
		vals = {"pointEst":0,"distribution":[]}
		
		probRange = [0,1]
		
		if momentum == "medGames":
			X_momentMed = 1
		elif momentum == "highGames":
			X_momentHigh = 1
		
		if lastSeason == "medPrevWin":
			X_prevSeasonWinMid = 1
		elif lastSeason =="highPrevWin":
			X_prevSeasonWinHigh = 1
		
		print(B_week["est"])
		
		outputEst = intercept["est"] + B_week["est"] * X_week + B_momentMed["est"] * X_momentMed + B_momentHigh["est"] * X_momentHigh + B_prevSeasonWinMid["est"] * X_prevSeasonWinMid + B_prevSeasonWinHigh["est"] * X_prevSeasonWinHigh
		
		stdevsOut = 4.5
		x = np.linspace(outputEst - stdevsOut * 490, outputEst + stdevsOut * 490, 80)
		y = norm.pdf(x, loc=outputEst, scale=490)
		
		valueArray = []
		for i in range(0,len(x)):
			valueArray.append({"x":x[i] / staffMult,"y":y[i]})
		
		
		print(outputEst)
	except Exception as e:
		print("ERROR")
		print(e)
	

	return(jsonify({"pointEst":outputEst,"values":valueArray, "key":"Expected Staffing Needs", "color":"#7777ff", "area":True}))








if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=5010, use_reloader=True)
