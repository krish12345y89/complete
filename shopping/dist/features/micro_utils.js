import * as amqplib from 'amqplib';
import { v4 as uuid } from 'uuid';
// Constants
const msgQueueUrl = 'amqps://cxcygule:DlO9FUKjM0ctgBDWBjxgmepdJhpaP4Gm@puffin.rmq2.cloudamqp.com/cxcygule';
const exchangeName = 'my_exchange';
const shoppingService = 'shopping_service';
// Connection and Channel Management
let amqplibConnection;
export const getChannel = async () => {
    if (!amqplibConnection) {
        amqplibConnection = await amqplib.connect(msgQueueUrl);
        console.log("connected  to channel");
    }
    return await amqplibConnection.createChannel();
};
export const createChannel = async () => {
    try {
        const channel = await getChannel();
        await channel.assertExchange(exchangeName, "direct", { durable: true });
        await channel.assertQueue("", { exclusive: true });
        return channel;
    }
    catch (err) {
        throw err;
    }
};
// Publishing and Subscribing
export const publishMessage = (channel, service, msg) => {
    channel.publish(exchangeName, service, Buffer.from(msg));
    console.log("Sent: ", msg);
};
export const subscribeMessage = async (channel) => {
    await channel.assertExchange(exchangeName, "direct", { durable: true });
    const q = await channel.assertQueue("", { exclusive: true });
    console.log(`Waiting for messages in queue: ${q.queue}`);
    channel.bindQueue(q.queue, exchangeName, shoppingService);
    const handleMessage = (msg) => {
        if (msg && msg.content) {
            console.log("Received message:", msg.content.toString());
            // service.SubscribeEvents(msg.content.toString());
        }
        console.log("[X] received");
    };
    channel.consume(q.queue, handleMessage, { noAck: true });
};
// RPC Request and Response
export const requestData = async (rpcQueueName, requestPayload, uuid) => {
    try {
        const channel = await getChannel();
        const q = await channel.assertQueue("", { exclusive: true });
        channel.sendToQueue(rpcQueueName, Buffer.from(JSON.stringify(requestPayload)), {
            replyTo: q.queue,
            correlationId: uuid,
        });
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                channel.close();
                reject(new Error("API could not fulfill the request!"));
            }, 8000);
            channel.consume(q.queue, (msg) => {
                if (msg && msg.properties.correlationId === uuid) {
                    resolve(JSON.parse(msg.content.toString()));
                    clearTimeout(timeout);
                }
                else {
                    reject(new Error("Data not found!"));
                }
            }, {
                noAck: true,
            });
        });
    }
    catch (error) {
        console.log(error);
        throw error;
    }
};
export const rpcRequest = async (rpcQueueName, requestPayload) => {
    const uuid4 = uuid(); // correlationId
    return await requestData(rpcQueueName, requestPayload, uuid4);
};
export const rpcObserver = async (rpcQueueName, service) => {
    const channel = await getChannel();
    await channel.assertQueue(rpcQueueName, {
        durable: false,
    });
    channel.prefetch(1);
    channel.consume(rpcQueueName, async (msg) => {
        if (msg && msg.content) {
            const payload = JSON.parse(msg.content.toString());
            const response = await service.serveRPCRequest(payload);
            channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response)), {
                correlationId: msg.properties.correlationId,
            });
            channel.ack(msg);
        }
    }, {
        noAck: false,
    });
};
