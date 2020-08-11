require('dotenv').config();

const {
  db,
  twitchChats,
  twitchCommands,
} = require('../src/db');

async function moveCommands() {
  try {
    const messages = await twitchChats.find({
      message: {
        $regex: /^!\w/
      }
    });
    await twitchCommands.insert(messages);
    await twitchChats.remove({
      _id: {
        $in: messages.map((m) => m._id),
      }
    });
    db.close();
  } catch (error) {
    console.error(error);
  }
}

moveCommands();
