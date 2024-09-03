import { createClient } from 'redis';
export const client = await createClient({
    password: 'oGfrq2Lil9Wdm6NE4gJ1QUVpINvcXNhX',
    socket: {
        host: 'redis-18915.c305.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 18915
    }
})
    .on('error', err => console.log('Redis Client Error', err))
    .connect().then(() => console.log("connected to redis"));
