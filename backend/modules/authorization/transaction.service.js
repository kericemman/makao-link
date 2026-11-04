const mongoose = require("mongoose");

const withAuthorizationTransaction = async (work, mongooseClient = mongoose) => {
  const session = await mongooseClient.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

module.exports = { withAuthorizationTransaction };
