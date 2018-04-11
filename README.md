# homebridge-advanced-thermostat

This is a HomeBridge plugin. Allows HomeKit to use your own Thermostat under HTTP protocol.

# Installation

You need to be root or use command "sudo" to install this packages.

*Is necessary has installed node.js with npm.

1. Install homebridge using: npm install -g homebridge
2. Install this plugin using: npm install -g homebridge-advanced-thermostat
3. Update your configuration file. See bellow for a sample. 

*note* If you are experimenting problems to install this plugin try to add "-unsafe--perm" (without ")
       - sudo npm install -g -unsafe--perm homebridge-advanced-thermostat -

# Configuration

Configuration sample:

 ```
    {
        "bridge": {
            ...
        },
        
        "description": "...",

        "accessories": [
            {
                "accessory": "Thermostat",
                "name": "Thermostat name",
                "apiAdress": "http://url",
                "maxTemp": "25",                      // Optional Max Number 100
                "minTemp": "15",                      // Optional Min Numbber 0
                "username": "user",                   // Optional
                "password": "pass"                    // Optional
                "manufacturer": "manufacturer",       // Optional
                "model": "model",                     // Optional
                "serial_number": "serial number",     // Optional
                "units": "dispCelsius"                // Optional (Default dispCelsius = Celsius) dispFahrenheit = Fahrenheit 
                
            }
        ],

        "platforms":[]
    }
```
# Node(API) Configuration or whatever be your Thermostat platform (What the plugin expects to receive)

The `apiAdress` is used for two main calls: Get and Set data to the Thermostat. Your Node(API) should provide

1. Get Target and Current State from thermostat.

  JSON Format with:
  
```
GET /status
{
    "currentState": SHORT_INT_VALUE,    // 0 OFF 1 HEAT 2 COOL
    "getTargetState": SHORT_INT_VALUE   // 0 OFF 1 HEAT 2 COOL 3 AUTO
}
```

2. Set/Get Temperature, Humidity and Units(Temperature Units) from thermostat 
  
  JSON Format with:

```
GET /info
{
    "temperature": FLOAT_VALUE,         // Current Temperature 
    "tarTemperature": FLOAT_VALUE,      // Target Temperature 
    "heatThreshold": FLOAT_VALUE,       // Heat Threshold 
    "coolThreshold": FLOAT_VALUE,       // Cool Threshold 
    "humidity": FLOAT_VALUE,            // Current Humidity
    "units": SHORT_INT_VALUE            // 0 to SET Celsius 1 to SET Fahrenheit 
}
```

3. Set target State
```
POST /setTargetState/{INT_VALUE}         // 0 OFF 1 HEAT 2 COOL 3 AUTO
OK (200)
```

4. Set target Temperature 
```
POST /targetTemperature/{FLOAT_VALUE}    // Target Temperature 
OK (200)
```

5. Set target Heat Threshold  
```
POST /heatThreshold/{FLOAT_VALUE}    // Target Heat Threshold 
OK (200)
```

6. Set target Cool Threshold  
```
POST /coolThreshold/{FLOAT_VALUE}    // Target Cool Threshold 
OK (200)
```

7. Set Display Units  
```
POST /units/{INT_VALUE}    // Set up Celsius or Fahrenheit, 0 to SET Celsius 1 to SET Fahrenheit 
OK (200)
```

Now you can SWAP between Cº to Fº. 

To visualize the temperture in Fº, you must change your Display unit configuration
in your Iphone.

You can do it going to 

1º Settings
2º General
3º Language & Region
4º Temperature Unit

This function set up the node to display the units in Fº but internally HomeKit only works in Cº.

Here you can download an Arduino scketch for ESP8266 to get working your own Thermostat system
https://github.com/SaMuELToLoKo/ESP8266-homebridge-advanced-thermostat.git

Thanks and hope this help someone to implement a cool Thermostat at home.
