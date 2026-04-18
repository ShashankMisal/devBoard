const path = require('path');

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

let mongoServer;

jest.setTimeout(60000);

beforeAll(async () => {
  // Using an in-memory database keeps tests isolated from the developer's local MongoDB instance.
  mongoServer = await MongoMemoryServer.create({
    instance: {
      ip: '127.0.0.1'
    }
  });
  await mongoose.connect(mongoServer.getUri(), {
    dbName: 'devboard-test'
  });
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
});
