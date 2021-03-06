/* eslint-disable no-console */
// Infrastructure
import SettingsFactory from 'data/SettingsFactory';
import CloudConnectorFactory from 'network/CloudConnectorFactory';
import CloudConnectionHandler from 'network/CloudConnectionHandler';
import AMQPConnectionFactory from 'network/AMQPConnectionFactory';
import MessagePublisher from 'network/MessagePublisher';
import MessageHandlerFactory from 'network/MessageHandlerFactory';

// Logger
import logger from 'util/logger';

async function main() {
  logger.info('KNoT Fog Connnector started');

  try {
    const settings = new SettingsFactory().create();

    logger.info(`Connecting to '${settings.cloudType}' cloud`);
    const cloud = CloudConnectorFactory.create(
      settings.cloudType,
      settings.cloud
    );

    if (settings.runAs.enabled) {
      process.setgid(settings.runAs.group);
      process.setuid(settings.runAs.user);
    }

    const amqpConnection = new AMQPConnectionFactory(settings.fog).create();
    await amqpConnection.start();

    const publisher = new MessagePublisher(amqpConnection, settings.fog.token);
    const cloudConnectionHandler = new CloudConnectionHandler(cloud, publisher);
    const messageHandler = new MessageHandlerFactory(
      cloud,
      amqpConnection
    ).create();

    await cloudConnectionHandler.start();
    await cloud.start();
    await messageHandler.start();
  } catch (err) {
    logger.error(err.stack);
  }
}

main();
