# KNoT Fog connector service

This is a KNoT Gateway service that connects the fog to a cloud service.

## Supported services

- [KNoT Cloud](https://github.com/CESARBR/knot-fog-connector-knot-cloud)
- [FIWARE](https://github.com/CESARBR/knot-fog-connector-fiware)

## Quickstart

```bash
$ npm install
$ npm run build
$ npm start
```

## Development Environment Setup

In order to test changes made to the [supported services](#supported-services), one must setup a development environment and run required services locally. Let it be noted, though, that changes should also be properly tested directly on KNoT Gateway.

### Prerequisites

**knot-fog-connector** requires [rabbitMQ](https://www.rabbitmq.com/) to be running. The default access ip and port for RabbitMQ are `localhost:5672`.

### Configuration

Configuration is made via a JSON file placed into `knot-fog-connector/config/` folder (see [config](https://www.npmjs.com/package/config) package documentation for more information). Find below, the parameters for such file.

- `fog` **Object** Fog service parameters.
- `cloudType` **String** cloud provider name. Currently, only [KNOT_CLOUD](####knot-cloud) or [FIWARE](####fiware) are supported options.
- `cloud` **Object** CloudType specific parameters (see below).

#### Fog

- `fog` **Object** fog parameters
  - `token` **String** User access token.
  - `hostname` **String** AMQP broker hostname.
  - `port` **Number** AMQP broker port.
  - `username` **String** AMQP broker username.
  - `password` **String** AMQP broker password.

```json
{
  "fog": {
    "token": "<knot-fog-user-token>",
    "hostname": "localhost",
    "port": 5672,
    "username": "knot",
    "password": "knot"
  }
}
```

#### KNoT-Cloud

> **_NOTE:_** The KNoT Cloud is an extended version of the currently supported fog solution and for that reason, their configuration looks similar. However, it's important to notice the `cloud` instance should be running with its own message broker instance.

- `cloud` **Object** cloud parameters
  - `token` **String** User access token.
  - `hostname` **String** AMQP broker hostname.
  - `port` **Number** AMQP broker port.
  - `username` **String** AMQP broker username.
  - `password` **String** AMQP broker password.

```json
{
  "cloudType": "KNOT_CLOUD",
  "cloud": {
    "token": "<knot-cloud-user-token>",
    "hostname": "broker.knot.cloud",
    "port": 5672,
    "username": "knot",
    "password": "knot"
  }
}
```

#### FIWARE

- `cloud` **Object** cloud parameters
  - `iota` **Object** object with hostname and port parameters
    - `hostname` **String**
    - `port` **Number**
  - `orion` **Object** object with hostname and port parameters
    - `hostname` **String**
    - `port` **Number**

```json
{
  "cloudType": "FIWARE",
  "cloud": {
    "iota": {
      "hostname": "localhost",
      "port": 4041
    },
    "orion": {
      "hostname": "localhost",
      "port": 1026
    }
  }
}
```

## Creating a connector

A connector is as a library that exports by default the `Connector` class. This service will use the library as follows:

```javascript
import CustomCloudConnector from '@cesarbr/knot-fog-connector-customcloud';

...
const connector = new CustomCloudConnector(config);
await connector.start();
```

### Methods

#### constructor(config)

Create the connector using a configuration object that will be loaded from a JSON file and passed directly to this constructor. No work, such as connecting to a service, must be done in this constructor.

##### Arguments

- `config` **Object** configuration parameters defined by the connector

##### Example

```javascript
import CustomCloudConnector from '@cesarbr/knot-fog-connector-customcloud';

const connector = new CustomCloudConnector({
  hostname: 'localhost',
  port: 3000,
  ...,
});
```

#### start(): Promise&lt;Void&gt;

Start the connector. This is the method where initialization procedures, such as connecting to external services, must be done.

##### Example

```javascript
import CustomCloudConnector from '@cesarbr/knot-fog-connector-customcloud';

const connector = new CustomCloudConnector({ ... });
await connector.start();
```

#### addDevice(device): Promise&lt;Void&gt;

Add a device to the cloud. Called when a new device is added to the fog.

##### Arguments

- `device` **Object** device specification containing the following properties:
  - `id` **String** device ID (KNoT ID)
  - `name` **String** device name

##### Result

- `device` **Object** device registered on the cloud.
  - `id` **String** device ID (KNoT ID)
  - `token` **String** device token

##### Example

```javascript
await connector.start();
await connector.addDevice({
  id: "918f2e0f4e19f990",
  name: "Front door",
});

// {
//   id: '918f2e0f4e19f990',
//   token: '5b67ce6bef21701331152d6297e1bd2b22f91787'
// }
```

#### removeDevice(id): Promise&lt;Void&gt;

Remove a device from the cloud. Called when a device is removed from the fog.

##### Arguments

- `id` **String** device ID (KNoT ID)

##### Example

```javascript
await connector.start();
await connector.removeDevice("918f2e0f4e19f990");
```

#### authDevice(id, token): Promise&lt;Boolean&gt;

Authenticate a device on the cloud. Called when it's necessary to verify if a device is valid on the cloud provider.

##### Arguments

- `id` **String** device ID (KNoT ID)
- `token` **String** device token

##### Result

- `status` **Boolean** response that represents the authentication status (true/false).

##### Example

```javascript
await connector.start();
const status = await connector.authDevice(
  "918f2e0f4e19f990",
  "0c20c12e2ac058d0513d81dc58e33b2f9ff8c83d"
);
console.log(status);

// true
```

#### listDevices(): Promise&lt;Object&gt;

List the devices registered on the cloud for the current gateway.

##### Result

- `devices` **Array** devices registered on the cloud or an empty array. Each device is an object in the following format:
  - `id` **String** device ID (KNoT ID)
  - `name` **String** device name
  - `config` **Array** config items, as specified in [`updateConfig()`](#updateconfigid-config-promisevoid)

##### Example

```javascript
await connector.start();
const devices = await connector.listDevices();
console.log(devices);

// [
//   { id: '918f2e0f4e19f990', name: 'Front door', schema: [{ sensorId: 1, ... }, ...] },
//   { id: '918f2e0f4e19f990', name: 'Back door', schema: [{ sensorId: 1, ... }, ...] }
// ]
```

#### publishData(id, data): Promise&lt;Void&gt;

Publish data as a device. Called when a device publishes data on the fog.

##### Arguments

- `id` **String** device ID (KNoT ID)
- `data` **Array** data items to be published, each one formed by:
  - `sensorId` **Number** sensor ID
  - `value` **Number|Boolean|String** sensor value

##### Example

```javascript
await connector.start();
await connector.publishData("918f2e0f4e19f990", [
  {
    sensorId: 1,
    value: false,
  },
  {
    sensorId: 2,
    value: 1000,
  },
]);
```

#### updateConfig(id, config): Promise&lt;Void&gt;

Update the device config. Called when a device updates its config on the fog.

##### Arguments

- `id` **String** device ID (KNoT ID)
- `config` **Array** config items, each one formed by:
  - `sensorId` **Number** sensor ID
  - `schema` **JSON Object** schema item, formed by:
    - `typeId` **Number** semantic value type (voltage, current, temperature, etc)
    - `unit` **Number** sensor unit (V, A, W, etc)
    - `valueType` **Number** data value type (boolean, integer, etc)
    - `name` **String** sensor name
  - `event` **JSON Object** - **Optional** event item, formed by:
    - `change` **Boolean** enable sending sensor data when its value changes
    - `timeSec` **Number** - **Optional** time interval in seconds that indicates when data must be sent to the cloud
    - `lowerThreshold` **(Depends on schema's valueType)** - **Optional** send data to the cloud if it's lower than this threshold
    - `upperThreshold` **(Depends on schema's valueType)** - **Optional** send data to the cloud if it's upper than this threshold


Refer to the [protocol](https://github.com/CESARBR/knot-protocol-source) for more information on the possible values for each field.

**NOTE**: `config` will always contain the whole config and not a difference from a last update.

##### Example

```javascript
await connector.start();
await connector.updateConfig('918f2e0f4e19f990', [
  {
    sensorId: 1,
    schema: {
        typeId: 0xFFF1,
        unit: 0,
        valueType: 3,
        name: "Door lock"
      },
      event: {
        change: true,
        timeSec: 10,
        lowerThreshold: 1000,
        upperThreshold: 3000
      }
  },
  {
    sensorId: 2,
    ...
  }
]);
```

#### onDataRequested(cb): Promise&lt;Void&gt;

Register a callback to handle data requests from the cloud. Called when a cloud application requests the last value of a device's sensor.

##### Arguments

- `cb` **Function** event handler defined as `cb(id, sensorId)` where:
  - `id` **Number** device ID (KNoT ID)
  - `sensorIds` **Array** IDs of the sensor to send last value (**Number**)

##### Example

```javascript
await connector.start();
await connector.onDataRequested((id, sensorIds) => {
  console.log(
    `New data from '${sensorIds}' on device '${id}' is being requested`
  );
});

// New data from '1,2' on device '918f2e0f4e19f990' is being requested
```

#### onDataUpdated(cb): Promise&lt;Void&gt;

Register a callback to handle data updates from the cloud. Called when a cloud application requests to update a device's actuator.

##### Arguments

- `cb` **Function** event handler defined as `cb(id, data)` where:
  - `id` **Number** device ID (KNoT ID)
  - `data` **Array** updates for sensors/actuators, each one formed by:
    - `sensorId` **Number** ID of the sensor to update
    - `data` **Number|Boolean|String** data to be written

##### Example

```javascript
await connector.start();
await connector.onDataUpdated((id, sensorId, data) => {
  console.log(`Update actuator '${sensorId}' on device '${id}' to ${data}`);
});

// Update actuator '2' on device '918f2e0f4e19f990' to 1000
```

#### onDeviceUnregistered(cb): Promise&lt;Void&gt;

Register a callback to handle devices removed from the cloud. Called when a cloud removes a device.

##### Arguments

- `cb` **Function** event handler defined as `cb(id)` where:
  - `id` **Number** device ID (KNoT ID)

##### Example

```javascript
await connector.start();
await connector.onDeviceUnregistered((id) => {
  console.log(`Device '${id}' removed`);
});

// Device '2' removed
```

#### onDisconnected(cb): Promise&lt;Void&gt;

Register a callback to handle gateway disconnection.

##### Arguments

- `cb` **Function** event handler.

##### Example

```javascript
await connector.start();
await connector.onDisconnected(() => {
  console.log("Disconnected");
});

// Disconnected
```

#### onReconnected(cb): Promise&lt;Void&gt;

Register a callback to handle gateway reconnection.

##### Arguments

- `cb` **Function** event handler.

##### Example

```javascript
await connector.start();
await connector.onReconnected(() => {
  console.log("Reconnected");
});

// Reconnected
```
