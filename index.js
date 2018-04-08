// Plujin Thermostate for HomeKit - Homebridge
// Author Samuel Boix Torner
// Version 1.0.3.a
//
// This plujin allow to our Homebridge to manage a Thermostate instance in our own application.

//Program
var Service, Characteristic;
var request = require('request');

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory("homebridge-advanced-thermostat", "Thermostat", Thermostat);
};


function Thermostat(log, config) {
	var dispCelsius = Characteristic.TemperatureDisplayUnits.CELSIUS;
	var dispFahrenheit = Characteristic.TemperatureDisplayUnits.FAHRENHEIT;
	//Generic Config.
	this.log 							= log;
	this.apiAdress 							= config["apiAdress"];
	this.name 							= config["name"]					||	"Thermostat";
	this.manufacturer						= config["manufacturer"]				||	"User-Thermostat";
	this.model							= config["model"]					||	"Homebridge-Thermostat";
	this.serial_number						= config["serial_number"]				||	"XXX.XXX.XXX.XXX";
	//Specific config.
	this.CurrentHeatingCoolingState 				= Characteristic.CurrentHeatingCoolingState.OFF;
	this.TargetHeatingCoolingState 					= Characteristic.TargetHeatingCoolingState.OFF;
	this.CurrentTemperature 					= 20;
	this.TargetTemperature 						= 20;
	this.CurrentRelativeHumidity					= 20;
	//this.TargetRelativeHumidity 					= 20;  //This function is unavaliable for now.
	this.CoolingThresholdTemperature 				= 25;
	this.HeatingThresholdTemperature				= 20;
	//User config.
	this.http_method						= config["http_method"]					||	"GET";
	this.sendimmediately						= config["sendimmediately"]				||	"";
	this.username 							= config["username"]					||	"";
	this.password							= config["password"]					||	"";
	this.TemperatureDisplayUnits 					= config["units"]					||	dispCelsius;
	this.maxTemp							= config["maxTemp"]					||	38;
	this.minTemp							= config["minTemp"]					||	10;
	this.log(this.name, this.apiAdress);
	
	this.service = new Service.Thermostat(this.name);

}

Thermostat.prototype = {

	cToF: function(value) {
        return Number((9 * value / 5 + 32).toFixed(0));
        },
  	fToC: function(value) {
    	return Number((5 * (value - 32) / 9).toFixed(2));
  	},

	setUnits: function(callback) {
	if (this.TemperatureDisplayUnits == dispFahrenheit) {
	this.maxTemp = cToF(this.maxTemp);
	this.minTemp = cToF(this.minTemp);
	  }
	return callback(null);
	},

	identify: function(callback) {
		this.log('Identify requested!');
		return callback(); // succes
	},

	httpRequest: function(url, body, method, username, password, sendimmediately, callback) {
		return request({
			url: url,
			body: body,
			method: method,
			rejectUnauthorized: false,
			auth: {
				user: username,
				pass: password,
				sendImmediately: sendimmediately
			}
		},
		function(error, response, body) {
			callback(error, response, body)
		})
	},

	getCurrentHeatingCoolingState: function(callback) {
		this.log('Getting Current State from: ', this.apiAdress + '/status');
		return request.get({
			url: this.apiAdress + '/status',
			auth: {
				user: this.username,
				pass: this.password
			}
		}, (function(err, response, body) {
			var json;
			if (!err && response.statusCode === 200) {
				this.log('response success');
				json = JSON.parse(body);
				this.log("Current State is: %s", json.currentState);
				if (json.currentState == 0) {
					this.CurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.OFF;
				}
				else if (json.currentState == 1) {
					this.CurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.HEAT;
				}
				else if (json.currentState == 2) {
					this.CurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.COOL;
				}
				return callback(null, this.CurrentHeatingCoolingState);

			} else {
				this.log('Error getting Current State: %s', err);
				return callback("Error getting state: " + err);
			}
		}).bind(this));
	},

	getTargetHeatingCoolingState: function(callback) {
		this.log('Getting Target State from: ', this.apiAdress + '/status');
		return request.get({
			url: this.apiAdress + '/status',
			auth: {
				user: this.username,
				pass: this.password
			}
		}, (function(err, response, body) {
			var json;
			if (!err && response.statusCode === 200) {
				this.log('response success');
				json = JSON.parse(body);
				this.log("Target State is: %s", json.getTargetState);
				if (json.getTargetState == 0) {
					this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
				}
				else if (json.getTargetState == 1) {
					this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;
				}
				else if (json.getTargetState == 2) {
					this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.COOL;
				}
				else if (json.getTargetState == 3) {
					this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
				}
				return callback(null, this.TargetHeatingCoolingState);

			} else {
				this.log('Error getting Target State: %s', err);
				return callback("Error getting state: " + err);
			}
		}).bind(this));
	},

	setTargetHeatingCoolingState: function(value, callback) {
			var tarState = 0;
			this.log('Setting Target Stete from/to :', this.TargetHeatingCoolingState, value);
			if (value == Characteristic.TargetHeatingCoolingState.OFF) {
				this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
				tarState = 0;
			}
			else if (value == Characteristic.TargetHeatingCoolingState.HEAT) {
				this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;
				tarState = 1;
			}
			else if (value == Characteristic.TargetHeatingCoolingState.COOL) {
				this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.COOL;
				tarState = 2;
			}
			else if (value == Characteristic.TargetHeatingCoolingState.AUTO) {
				this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
				tarState = 3;
			}
			else {
				this.log('Unsupported value', value);
				tarState = 0;
				return callback(value + " state unsupported");
			}
			return request.post({
				url: this.apiAdress + '/setTargetState/' + tarState,
				auth: {
					user: this.username,
					pass: this.password
				}
			}, (function(err, response, body) {
				if (!err && response.statusCode === 200) {
					this.log('response succes');
					return callback(null);
				} else {
					this.log('Error setting Target State: %s', err);
					return callback("Error setting mode: " + err);
				}
			}).bind(this));
		},

		getCurrentTemperature: function(callback) {
			this.log('Getting Current Temperature from: ', this.apiAdress + '/info');
			return request.get({
				url: this.apiAdress + '/info',
				auth: {
					user: this.username,
					pass: this.password
				}
			}, (function(err, response, body) {
				var json;
				if (!err && response.statusCode === 200) {
	        this.log('response success');
	        json = JSON.parse(body);
	        this.log('Currente Temperature is %s (%s)', json.temperature, json.units);
					if (json.units == 0){
						this.CurrentTemperature = parseFloat(json.temperature);
					}
					else if (json.units == 1) {
					this.CurrentTemperature = this.cToF(parseFloat(json.temperature));
				}
	        return callback(null, this.CurrentTemperature);
	      } else {
	        this.log('Error getting current temp: %s', err);
	        return callback("Error getting current temp: " + err);
	      }
	    }).bind(this));
	  },

		getTargetTemperature: function(callback) {
			this.log('Getting Target Temperature from: ', this.apiAdress + '/info');
			return request.get({
				url: this.apiAdress + '/info',
				auth: {
					user: this.username,
					pass: this.password
				}
			}, (function(err, response, body) {
				var json;
				if (!err && response.statusCode === 200) {
        this.log('response success');
				json = JSON.parse(body);
				this.log('Target Temperature is %s (%s)', json.tarTemperature, json.units);
				if (json.units == 0) {
					this.TargetTemperature = parseFloat(json.tarTemperature);
				}
				else if (json.units == 1) {
					this.TargetTemperature = this.cToF(parseFloat(json.tarTemperature));
				}
				return callback(null, this.TargetTemperature);
			} else {
				this.log('Error getting target temp: %s', err);
				return callback("Error getting target temp: " + err);
				}
			}).bind(this));
  },

	setTargetTemperature: function(value, callback) {
			if (this.TemperatureDisplayUnits == Characteristic.TemperatureDisplayUnits.FAHRENHEIT) {
				value = this.cToF(value);
				}
			this.log('Setting Target Temperature from: ', this.apiAdress + '/targetTemperature/' + value);
			return request.post({
					url: this.apiAdress + '/targetTemperature/' + value,
					auth: {
						user: this.username,
						pass: this.password
				}
			}, (function(err, response, body) {
			if (!err && response.statusCode === 200) {
	 		this.log('response success');
	 		return callback(null);
 			} else {
	 		this.log('Error getting state: %s', err);
	 		return callback("Error setting target temp: " + err);
 			}
		}).bind(this));
	},

	getHeatingThresholdTemperature: function(callback) {
		this.log('Getting Heating Threshold from: ', this.apiAdress + '/info');
		return request.get({
			url: this.apiAdress + '/info',
			auth: {
				user: this.username,
				pass: this.password
			}
		}, (function(err, response, body) {
			var json;
			if (!err && response.statusCode === 200) {
			this.log('response success');
			json = JSON.parse(body);
			this.log('Target Heat threshoold is %s (%s)', json.heatThreshold, json.units);
			if (json.units == 0) {
				this.HeatingThresholdTemperature = parseFloat(json.heatThreshold);
			}
			else if (json.units == 1) {
				this.HeatingThresholdTemperature = this.cToF(parseFloat(json.heatThreshold));
			}
			return callback(null, this.HeatingThresholdTemperature);
		} else {
			this.log('Error getting target Heat threshold: %s', err);
			return callback("Error getting target heat threshold: " + err);
			}
		}).bind(this));
},

setHeatingThresholdTemperature: function(value, callback) {
		if (this.TemperatureDisplayUnits == Characteristic.TemperatureDisplayUnits.FAHRENHEIT) {
			value = cToF(value);
			}
		this.log('Setting Target Heat Threshold from: ', this.apiAdress + '/heatThreshold/' + value);
		return request.post({
				url: this.apiAdress + '/heatThreshold/' + value,
				auth: {
					user: this.username,
					pass: this.password
			}
		}, (function(err, response, body) {
		if (!err && response.statusCode === 200) {
		this.log('response success');
		return callback(null);
		} else {
		this.log('Error getting heat threshold: %s', err);
		return callback("Error setting target heat threshold: " + err);
		}
	}).bind(this));
},

getCoolingThresholdTemperature: function(callback) {
	this.log('Getting Cool Threshold from: ', this.apiAdress + '/info');
	return request.get({
		url: this.apiAdress + '/info',
		auth: {
			user: this.username,
			pass: this.password
		}
	}, (function(err, response, body) {
		var json;
		if (!err && response.statusCode === 200) {
		this.log('response success');
		json = JSON.parse(body);
		this.log('Target Cool threshold is %s (%s)', json.coolThreshold, json.units);
		if (json.units == 0) {
			this.CoolingThresholdTemperature = parseFloat(json.coolThreshold);
		}
		else if (json.units == 1) {
			this.CoolingThresholdTemperaturee = this.cToF(parseFloat(json.coolThreshold));
		}
		return callback(null, this.CoolingThresholdTemperature);
	} else {
		this.log('Error getting target Cool threshold: %s', err);
		return callback("Error getting target cool threshold: " + err);
		}
	}).bind(this));
},

setCoolingThresholdTemperature: function(value, callback) {
	if (this.TemperatureDisplayUnits == Characteristic.TemperatureDisplayUnits.FAHRENHEIT) {
		value = cToF(value);
		}
	this.log('Setting Target Cool Threshold from: ', this.apiAdress + '/coolThreshold/' + value);
	return request.post({
			url: this.apiAdress + '/coolThreshold/' + value,
			auth: {
				user: this.username,
				pass: this.password
		}
	}, (function(err, response, body) {
	if (!err && response.statusCode === 200) {
	this.log('response success');
	return callback(null);
	} else {
	this.log('Error getting cool threshold: %s', err);
	return callback("Error setting target cool threshold: " + err);
	}
}).bind(this));
},

			getTemperatureDisplayUnits: function(callback) {
					this.log('Getting Temperature Display Units from: ', this.apiAdress + '/info');
					return request.get({
						url: this.apiAdress + '/info',
						auth: {
							user: this.username,
							pass: this.password
						}
					}, (function(err, response, body) {
						var json;
						if (!err && response.statusCode === 200) {
			this.log('response success');
			json = JSON.parse(body);
			this.log('Temperature Display Units %s', json.units);
			if (json.units == 0) {
				this.TemperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS;
			}
			else if (json.units == 1) {
				this.TemperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.FAHRENHEIT;
			}
			return callback(null, this.TemperatureDisplayUnits);
		} else {
			this.log('Error getting Temperature Display Units', err);
			return callback("Error getting Temperature Display Units: " + err);
			}
		}).bind(this));
	},

			setTemperatureDisplayUnits: function(value, callback) {
				this.log('Setting Temperature Display Units from/to ', this.TemperatureDisplayUnits, value);
				return request.post({
					url: this.apiAdress + '/units/' + value,
					auth: {
						user: this.username,
						pass: this.password
					}
				}, (function(err, response, body) {
				if (!err && response.statusCode === 200) {
		 		this.log('response success');
		 	return callback(null);
	 		} else {
		 	this.log('Error getting state: %s', err);
		 	return callback("Error setting target temp: " + err);
	 		}
		}).bind(this));
	},

			getCurrentRelativeHumidity: function(callback) {
	 			this.log('getCurrentRelativeHumidity from:', this.apiAdress + '/info');
				return request.get({
					url: this.apiAdress + '/info',
					auth: {
						user: this.username,
						pass: this.password
					}
			}, (function(err, response, body) {
				var json;
			if (!err && response.statusCode === 200) {
		        	this.log('response success');
		        	json = JSON.parse(body);
		        	this.log('Currente Humidity is %s', json.humidity);
				this.CurrentRelativeHumidity = parseFloat(json.humidity);
		        	return callback(null, this.CurrentRelativeHumidity);
		      	} else {
		        this.log('Error getting current humidity: %s', err);
		        return callback("Error getting current hum: " + err);
		      }
		   }).bind(this));
		 },

 			getTargetRelativeHumidity: function(callback) {
	 			var error;
	 			this.log('Get humidity unsupported');
	 			error = "Get humidity unsupported";
	 			return callback(error);
 				},

 			setTargetRelativeHumidity: function(value, callback) {
	 			var error;
	 			this.log('Set humidity unsupported');
	 			error = "Set humidity unsupported";
	 			return callback(error);
 				},

 			getName: function(callback) {
	 			var error;
	 			this.log('getName :', this.name);
	 			error = null;
	 			return callback(error, this.name);
 			},

			getServices: function() {

				var informationService = new Service.AccessoryInformation();

				informationService
				.setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
				.setCharacteristic(Characteristic.Model, this.model)
				.setCharacteristic(Characteristic.SerialNumber, this.serial_number);

				this.service
				.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
				.on('get', this.getCurrentHeatingCoolingState.bind(this));

				this.service
				.getCharacteristic(Characteristic.TargetHeatingCoolingState)
				.on('get', this.getTargetHeatingCoolingState.bind(this))
				.on('set', this.setTargetHeatingCoolingState.bind(this));

				this.service
				.getCharacteristic(Characteristic.CurrentTemperature)
				.on('get', this.getCurrentTemperature.bind(this));

				this.service
				.getCharacteristic(Characteristic.TargetTemperature)
				.on('get', this.getTargetTemperature.bind(this))
				.on('set', this.setTargetTemperature.bind(this));

				this.service
				.getCharacteristic(Characteristic.TemperatureDisplayUnits)
				.on('get', this.getTemperatureDisplayUnits.bind(this))
				.on('set', this.setTemperatureDisplayUnits.bind(this));

				this.service
				.getCharacteristic(Characteristic.CurrentRelativeHumidity)
				.on('get', this.getCurrentRelativeHumidity.bind(this));

				/*
				this.service
				.getCharacteristic(Characteristic.TargetRelativeHumidity)
				.on('get', this.getTargetRelativeHumidity.bind(this))
				.on('set', this.setTargetRelativeHumidity.bind(this));
				*/

				this.service
				.getCharacteristic(Characteristic.HeatingThresholdTemperature)
				.on('get', this.getHeatingThresholdTemperature.bind(this))
				.on('set', this.setHeatingThresholdTemperature.bind(this));

				this.service
				.getCharacteristic(Characteristic.CoolingThresholdTemperature)
				.on('get', this.getCoolingThresholdTemperature.bind(this))
				.on('set', this.setCoolingThresholdTemperature.bind(this));

				this.service
				.getCharacteristic(Characteristic.Name)
				.on('get', this.getName.bind(this));

				this.service
				.getCharacteristic(Characteristic.CurrentTemperature)
				.setProps({
						maxValue: 100,
						minValue: 0,
						minStep: 1
				});

				this.service
				.getCharacteristic(Characteristic.TargetTemperature)
				.setProps({
						maxValue: this.maxTemp,
						minValue: this.minTemp,
						minStep: 1
				});

				this.service
				.getCharacteristic(Characteristic.HeatingThresholdTemperature)
				.setProps({
						maxValue: 35,
						minValue: 0,
						minStep: 1
				});

				this.service
				.getCharacteristic(Characteristic.CoolingThresholdTemperature)
				.setProps({
						maxValue: 35,
						minValue: 0,
						minStep: 1
				});

				return [informationService, this.service];

		}

};
