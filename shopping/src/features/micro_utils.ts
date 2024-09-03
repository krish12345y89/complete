import * as amqplib from 'amqplib';
import { json } from 'body-parser';
import { v4 as uuid } from 'uuid';

// Constants
const msgQueueUrl = 'amqps://cxcygule:DlO9FUKjM0ctgBDWBjxgmepdJhpaP4Gm@puffin.rmq2.cloudamqp.com/cxcygule';
const exchangeName = 'my_exchange';
const shoppingService = 'shopping_service';

// Connection and Channel Management
let amqplibConnection: amqplib.Connection;

export const getChannel = async (): Promise<amqplib.Channel> => {
  if (!amqplibConnection) {
    amqplibConnection = await amqplib.connect(msgQueueUrl);
    console.log("connected  to channel")
  }
  return await amqplibConnection.createChannel();
};

export const createChannel = async (): Promise<amqplib.Channel> => {
  try {
    const channel = await getChannel();
    await channel.assertExchange(exchangeName, "direct", { durable: true });
    await channel.assertQueue("", { exclusive: true });
    return channel;
  } catch (err) {
    throw err;
  }
};

// Publishing and Subscribing
export const publishMessage = (channel: amqplib.Channel, service: string, msg: any): void => {
  channel.publish(exchangeName, service, Buffer.from(msg));
  console.log("Sent: ", msg);
};

export const subscribeMessage = async (channel: amqplib.Channel): Promise<void> => {
  await channel.assertExchange(exchangeName, "direct", { durable: true });
  const q = await channel.assertQueue("", { exclusive: true });
  console.log(`Waiting for messages in queue: ${q.queue}`);

  channel.bindQueue(q.queue, exchangeName, shoppingService);

  const handleMessage = (msg: amqplib.ConsumeMessage | null) => {
    if (msg && msg.content) {
      console.log("Received message:", msg.content.toString());
      // service.SubscribeEvents(msg.content.toString());
    }
    console.log("[X] received");
  };

  channel.consume(q.queue, handleMessage, { noAck: true });
};

// RPC Request and Response
export const requestData = async (rpcQueueName: string, requestPayload: any, uuid: string): Promise<any> => {
  try {
    const channel = await getChannel();

    const q = await channel.assertQueue("", { exclusive: true });

    channel.sendToQueue(
      rpcQueueName,
      Buffer.from(JSON.stringify(requestPayload)),
      {
        replyTo: q.queue,
        correlationId: uuid,
      }
    );

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        channel.close();
        reject(new Error("API could not fulfill the request!"));
      }, 8000);

      channel.consume(
        q.queue,
        (msg: amqplib.ConsumeMessage | null) => {
          if (msg && msg.properties.correlationId === uuid) {
            resolve(JSON.parse(msg.content.toString()));
            clearTimeout(timeout);
          } else {
            reject(new Error("Data not found!"));
          }
        },
        {
          noAck: true,
        }
      );
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const rpcRequest = async (rpcQueueName: string, requestPayload: any): Promise<any> => {
  const uuid4 = uuid(); // correlationId
  return await requestData(rpcQueueName, requestPayload, uuid4);
};

export const rpcObserver = async (rpcQueueName: string, service: any): Promise<void> => {
  const channel = await getChannel();
  await channel.assertQueue(rpcQueueName, {
    durable: false,
  });
  channel.prefetch(1);
  channel.consume(
    rpcQueueName,
    async (msg: amqplib.ConsumeMessage | null) => {
      if (msg && msg.content) {
        const payload = JSON.parse(msg.content.toString());
        const response = await service.serveRPCRequest(payload);
        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify(response)),
          {
            correlationId: msg.properties.correlationId,
          }
        );
        channel.ack(msg);
      }
    },
    {
      noAck: false,
    }
  );
};