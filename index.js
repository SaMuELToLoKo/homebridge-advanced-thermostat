// Homebridge plugin for thermostats supported by Infinitive
// Author John Burwell
// Version 0.0.1	
//
// Adds support for Infinitive to Homebridge


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

	// Plugin configuration
	this.log = log;
	this.apiAddress = config["apiAddress"];
	this.name = config["name"] || "Thermostat";
	this.manufacturer = config["manufacturer"] || "User-Thermostat";
	this.model = config["model"] ||	"Homebridge-Thermostat";
	this.serial_number = config["serial_number"] ||	"XXX.XXX.XXX.XXX";

	// Thermostat configuration
	this.CurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.OFF;
	this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
	this.CurrentTemperature = 20;
	this.TargetTemperature = 20;
	this.CurrentRelativeHumidity = 20;
	this.CurrentFanState = Characteristic.CurrentFanState.INACTIVE;
	this.CoolingThresholdTemperature = 25;
	this.HeatingThresholdTemperature = 20;

	// Infinitive API configuration
	this.username = config["username"] ||	"";
	this.password = config["password"] ||	"";
	this.TemperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.FAHRENHEIT;
	this.maxTemp = config["maxTemp"] ||	38;
	this.minTemp = config["minTemp"] ||	10;
	this.log(this.name, this.apiAddress);

	this.ThermostatService = new Service.Thermostat(this.name);
	this.FanService = new Service.Fan(this.name);

}

Thermostat.prototype = {

	cToF: function(value) {
        return Number((9 * value / 5 + 32).toFixed(0));
	},

	fToC: function(value) {
    	return Number((5 * (value - 32) / 9).toFixed(4));
  	},

	identify: function(callback) {
		this.log('Identify requested');
		return callback(); // success
	},

	getCurrentHeatingCoolingState: function(callback) {
		this.log('Getting current mode from: ', this.apiAddress + '/config');
		return request.get({
			url: this.apiAddress + '/config',
			auth: {
				user: this.username,
				pass: this.password
			}
		}, (function(err, response, body) {
			var json;
			if (!err && response.statusCode === 200) {
				this.log('response success');
				json = JSON.parse(body);
				this.log("Current mode is: %s", json.mode);
				if (json.mode == "off") {
					this.CurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.OFF;
				}
				else if (json.mode == "heat") {
					this.CurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.HEAT;
				}
				else if (json.mode == "cool") {
					this.CurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.COOL;
				}
				else if (json.mode == "auto") {
					this.CurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.AUTO;
				}
				return callback(null, this.CurrentHeatingCoolingState);

			} else {
				this.log('Error getting current mode: %s', err);
				return callback("Error getting mode: " + err);
			}
		}).bind(this));
	},

	getTargetHeatingCoolingState: function(callback) {
		this.log('Getting target mode from: ', this.apiAddress + '/config');
		return request.get({
			url: this.apiAddress + '/config',
			auth: {
				user: this.username,
				pass: this.password
			}
		}, (function(err, response, body) {
			var json;
			if (!err && response.statusCode === 200) {
				this.log('response success');
				json = JSON.parse(body);
				this.log("Target mode is: %s", json.mode);
				if (json.mode == "off") {
					this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
				}
				else if (json.mode == "heat") {
					this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;
				}
				else if (json.mode == "cool") {
					this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.COOL;
				}
				else if (json.mode == "auto") {
					this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
				}
				return callback(null, this.TargetHeatingCoolingState);

			} else {
				this.log('Error getting target mode: %s', err);
				return callback("Error getting mode: " + err);
			}
		}).bind(this));
	},

	setTargetHeatingCoolingState: function(value, callback) {
		var tarState = "";
		this.log('Setting target mode from/to', this.TargetHeatingCoolingState, value);
		if (value == Characteristic.TargetHeatingCoolingState.OFF) {
			this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
			tarState = "off";
		}
		else if (value == Characteristic.TargetHeatingCoolingState.HEAT) {
			this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;
			tarState = "heat";
		}
		else if (value == Characteristic.TargetHeatingCoolingState.COOL) {
			this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.COOL;
			tarState = "cool";
		}
		else if (value == Characteristic.TargetHeatingCoolingState.AUTO) {
			this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
			tarState = "auto";
		}
		else {
			this.log('Unsupported value', value);
			tarState = "";
			return callback(value + " mode unsupported");
		}
		return request.put({
			url: this.apiAddress + '/config',
			json: {
				mode: tarState
			},
			auth: {
				user: this.username,
				pass: this.password
			}
		}, (function(err, response, body) {
			if (!err && response.statusCode === 200) {
				this.log('response success');
				return callback(null);
			} else {
				this.log('Error setting target mode: %s', err);
				return callback("Error setting mode: " + err);
			}
		}).bind(this));
	},

	getCurrentTemperature: function(callback) {
		this.log('Getting current temperature from: ', this.apiAddress + '/config');
		return request.get({
			url: this.apiAddress + '/config',
			auth: {
			user: this.username,
			pass: this.password
		}
		}, (function(err, response, body) {
			var json;
			if (!err && response.statusCode === 200) {
				this.log('response success');
				json = JSON.parse(body);
				if (json.units == 0){
					this.log('Current temperature in degrees Celsius is %s (%s)', json.currentTemp, json.units);
					this.CurrentTemperature = parseFloat(json.currentTemp);
				}
				else if (json.units == 1) {
					this.log('Current temperature in degrees Fahrenheit is %s (%s)', json.currentTemp, json.units);
					this.CurrentTemperature = this.fToC(parseFloat(json.currentTemp));
				}
			return callback(null, this.CurrentTemperature);
			} else {
				this.log('Error getting current temperature: %s', err);
				return callback("Error getting current temperature: " + err);
			}
			}).bind(this));
	},

	getTargetTemperature: function(callback) {
		this.log('Getting target temperature from: ', this.apiAddress + '/config');
		return request.get({
			url: this.apiAddress + '/config',
			auth: {
				user: this.username,
				pass: this.password
			}
		}, (function(err, response, body) {
			var json;
			if (!err && response.statusCode === 200) {
				this.log('response success');
			json = JSON.parse(body);
			if (json.units == 0) {
				this.log('Target temperature in degrees Celsius is %s (%s)', json.currentTemp, json.units);
				this.TargetTemperature = parseFloat(json.currentTemp);
			}
			else if (json.units == 1) {
				this.log('Target temperature in degrees Fahrenheit is %s (%s)', json.currentTemp, json.units);
				this.TargetTemperature = this.fToC(parseFloat(json.currentTemp));
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
			this.log('Setting target temperature from: ', this.apiAddress + '/config');
			
			var modeJson = JSON;
			
			switch (this.TargetHeatingCoolingState) {
				case Characteristic.TargetHeatingCoolingState.HEAT:
					modeJson.heatSetpoint = value;
					break;
				case Characteristic.TargetHeatingCoolingState.COOL:
					modeJson.coolSetpoint = value;
					break;
				case Characteristic.TargetHeatingCoolingState.AUTO:
					modeJson.coolSetpoint = (value + 2);
					modeJson.heatSetpoint = (value - 3);
					break;
				default:
					break;
			}

			return request.put({
				url: this.apiAddress + '/config',
				json: modeJson,
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
		this.log('Getting heating threshold from: ', this.apiAddress + '/config');
		return request.get({
			url: this.apiAddress + '/config',
			auth: {
				user: this.username,
				pass: this.password
			}
		}, (function(err, response, body) {
			var json;
			if (!err && response.statusCode === 200) {
				this.log('response success');
				json = JSON.parse(body);
				if (json.units == 0) {
					this.log('Target heat threshold in degrees Celsius is %s (%s)', json.heatSetpoint, json.units);
					this.HeatingThresholdTemperature = parseFloat(json.heatSetpoint);
				}
				else if (json.units == 1) {
					this.log('Target heat threshold in degrees Fahrenheit is %s (%s)', json.heatSetpoint, json.units);
					this.HeatingThresholdTemperature = this.fToC(parseFloat(json.heatSetpoint));
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
				value = this.cToF(value);
			}
			this.log('Setting target heat threshold from: ', this.apiAddress + '/config');
			return request.put({
				url: this.apiAddress + '/config',
				json: {
					heatSetpoint: value
				},
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
			this.log('Getting cool threshold from: ', this.apiAddress + '/config');
			return request.get({
				url: this.apiAddress + '/config',
				auth: {
					user: this.username,
					pass: this.password
			}
			}, (function(err, response, body) {
				var json;
				if (!err && response.statusCode === 200) {
					this.log('response success');
					json = JSON.parse(body);
					if (json.units == 0) {
						this.log('Target cool threshold in degrees Celsius is %s (%s)', json.coolSetpoint, json.units);
						this.CoolingThresholdTemperature = parseFloat(json.coolSetpoint);
					}
					else if (json.units == 1) {
						this.log('Target Cool Threshold in degrees Fahrenheit is %s (%s)', json.coolSetpoint, json.units);
						this.CoolingThresholdTemperature = this.fToC(parseFloat(json.coolSetpoint));
					}
					return callback(null, this.CoolingThresholdTemperature);
				} else {
					this.log('Error getting target cool threshold: %s', err);
					return callback("Error getting target cool threshold: " + err);
				}
		}).bind(this));
	},

	setCoolingThresholdTemperature: function(value, callback) {
			if (this.TemperatureDisplayUnits == Characteristic.TemperatureDisplayUnits.FAHRENHEIT) {
				value = this.cToF(value);
			}
			this.log('Setting target cool threshold from: ', this.apiAddress + '/config');
			return request.put({
				url: this.apiAddress + '/config',
				json: {
					coolSetpoint: value
				},
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
			this.log('Getting temperature display units from: ', this.apiAddress + '/config');
			// return request.get({
			// 	url: this.apiAddress + '/config',
			// 	auth: {
			// 		user: this.username,
			// 		pass: this.password
			// 	}
			// }, (function(err, response, body) {
			// 	var json;
			// 	if (!err && response.statusCode === 200) {
			// 		this.log('response success');
			// 		json = JSON.parse(body);
			// 		if (json.units == 0) {
			// 			this.TemperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS;
			// 			this.log('Temperature Display Units is degrees Celsius');
			// 		}
			// 		else if (json.units == 1) {
						this.TemperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.FAHRENHEIT;
						this.log('Temperature display units is degrees Fahrenheit');
			// 		}
					return callback(null, this.TemperatureDisplayUnits);
			// 	} else {
			// 		this.log('Error getting temperature display units', err);
			// 		return callback("Error getting temperature display units: " + err);
			// 	}
			// }).bind(this));
	},

	setTemperatureDisplayUnits: function(value, callback) {
		this.log('Setting temperature display units from/to ', this.TemperatureDisplayUnits, Characteristic.TemperatureDisplayUnits.FAHRENHEIT);
		// return request.post({
		// 	url: this.apiAddress + '/units/' + value,
		// 	auth: {
		// 		user: this.username,
		// 		pass: this.password
		// 	}
		// }, (function(err, response, body) {
		// 	if (!err && response.statusCode === 200) {
		// 		this.log('response success');
				this.TemperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.FAHRENHEIT;
				return callback(null);
			// } else {
			// 	this.log('Error getting state: %s', err);
			// 	return callback("Error setting target temp: " + err);
			// }
		// }).bind(this));
	},

	getCurrentRelativeHumidity: function(callback) {
		this.log('Getting current relative humidity from:', this.apiAddress + '/config');
		return request.get({
			url: this.apiAddress + '/config',
			auth: {
				user: this.username,
				pass: this.password
			}
		}, (function(err, response, body) {
			var json;
			if (!err && response.statusCode === 200) {
					this.log('response success');
					json = JSON.parse(body);
					this.log('Current humidity is %s', json.currentHumidity);
				this.CurrentRelativeHumidity = parseFloat(json.currentHumidity);
					return callback(null, this.CurrentRelativeHumidity);
				} else {
				this.log('Error getting current humidity: %s', err);
					return callback("Error getting current humidity: " + err);
				}
		}).bind(this));
	 },

	 getCurrentFanState: function(callback) {
		this.log('Getting current fan state from:', this.apiAddress + '/config');
		return request.get({
			url: this.apiAddress + '/config',
			auth: {
				user: this.username,
				pass: this.password
			}
		}, (function(err, response, body) {
			var json;
			if (!err && response.statusCode === 200) {
				this.log('response success');
				json = JSON.parse(body);
				this.log('Current fan state is %s', json.fanMode);

				switch (json.fanMode) {
					case "off":
						this.CurrentFanState = Characteristic.CurrentFanState.INACTIVE;
						break;
					case "auto":
					case "low":
					case "medium":
					case "high":
						this.CurrentFanState = Characteristic.CurrentFanState.BLOWING_AIR;
						break;
					default:
						this.CurrentFanState = Characteristic.CurrentFanState.IDLE;
						break;
				}
				return callback(null, this.CurrentFanState);
			} else {
			this.log('Error getting current fan state: %s', err);
				return callback("Error getting current fan state: " + err);
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

		this.ThermostatService
		.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
		.on('get', this.getCurrentHeatingCoolingState.bind(this));

		this.ThermostatService
		.getCharacteristic(Characteristic.TargetHeatingCoolingState)
		.on('get', this.getTargetHeatingCoolingState.bind(this))
		.on('set', this.setTargetHeatingCoolingState.bind(this));

		this.ThermostatService
		.getCharacteristic(Characteristic.CurrentTemperature)
		.on('get', this.getCurrentTemperature.bind(this));

		this.ThermostatService
		.getCharacteristic(Characteristic.TargetTemperature)
		.on('get', this.getTargetTemperature.bind(this))
		.on('set', this.setTargetTemperature.bind(this));

		this.ThermostatService
		.getCharacteristic(Characteristic.TemperatureDisplayUnits)
		.on('get', this.getTemperatureDisplayUnits.bind(this))
		.on('set', this.setTemperatureDisplayUnits.bind(this));

		this.ThermostatService
		.getCharacteristic(Characteristic.CurrentRelativeHumidity)
		.on('get', this.getCurrentRelativeHumidity.bind(this));

		this.ThermostatService
		.getCharacteristic(Characteristic.HeatingThresholdTemperature)
		.on('get', this.getHeatingThresholdTemperature.bind(this))
		.on('set', this.setHeatingThresholdTemperature.bind(this));

		this.ThermostatService
		.getCharacteristic(Characteristic.CoolingThresholdTemperature)
		.on('get', this.getCoolingThresholdTemperature.bind(this))
		.on('set', this.setCoolingThresholdTemperature.bind(this));

		this.ThermostatService
		.getCharacteristic(Characteristic.Name)
		.on('get', this.getName.bind(this));

		this.ThermostatService
		.getCharacteristic(Characteristic.CurrentTemperature)
		.setProps({
			maxValue: 100,
			minValue: 0,
			minStep: 1
		});

		this.ThermostatService
		.getCharacteristic(Characteristic.TargetTemperature)
		.setProps({
			maxValue: this.maxTemp,
			minValue: this.minTemp,
			minStep: 0.5
		});

		this.ThermostatService
		.getCharacteristic(Characteristic.HeatingThresholdTemperature)
		.setProps({
			maxValue: 35,
			minValue: 0,
			minStep: 0.5
		});

		this.ThermostatService
		.getCharacteristic(Characteristic.CoolingThresholdTemperature)
		.setProps({
			maxValue: 35,
			minValue: 0,
			minStep: 0.5
		});

		return [informationService, this.ThermostatService];

	}

};
