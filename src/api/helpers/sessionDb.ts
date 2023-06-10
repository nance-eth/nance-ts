import RedisStore from 'connect-redis';
import Redis from 'ioredis';

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
const redis = new Redis({
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  password: REDIS_PASSWORD,
  tls: { rejectUnauthorized: false }
});
const store = new RedisStore({ client: redis });

export default store;
