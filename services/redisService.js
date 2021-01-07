const redis = require('redis');
const bluebird = require('bluebird');
const log4js = require('log4js');

// const Promise = bluebird.Promise;
log4js.configure('./config/log4js.json');
const log = log4js.getLogger('services-redis-service');

bluebird.promisifyAll(redis.RedisClient.prototype);

const client = redis.createClient();

client.on("error", (error) => {
  log.error('error occured on redis client', error);
});

const USER = 'user';

async function setUserTokens(userId, accessToken, refreshToken) {
  const userTokenSet = JSON.stringify({
    accessToken,
    refreshToken,
  });
  const userKey = `${USER}:${userId}`;
  await client.setAsync(userKey, userTokenSet);
}

async function getUserTokens(userId) {
  const userKey = `${USER}:${userId}`;
  const tokens = await client.getAsync(userKey);
  return JSON.parse(tokens);
}

async function removeUserTokens(userId) {
  const userKey = `${USER}:${userId}`;
  await client.delAsync(userKey);
}

module.exports = {
  setUserTokens,
  getUserTokens,
  removeUserTokens,
};