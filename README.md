# homebridge-infinitive-thermostat

Homebridge plugin for thermostats supported by [Infinitive](https://github.com/acd/infinitive), including Carrier Infinity and Bryant Evolution.

# Configuration

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
                "apiEndpoint": "http://infinitive-host-or-ip:port/api",
                "manufacturer": "manufacturer",       // Optional
                "model": "model",                     // Optional
                "serial_number": "serial number"     // Optional
            }
        ],

        "platforms":[]
    }
```
