import { createClient } from "redis";
import { REDIS_URL } from '$env/static/private';

export const redis = createClient(REDIS_URL);
redis.connect()
