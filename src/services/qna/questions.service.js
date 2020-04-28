/* eslint-disable class-methods-use-this */
const {
  questionsAndComments
} = require('../../db');

class QuestionsService {
  async find() {
    return questionsAndComments.find({
      deleted_at: {
        $eq: null,
      },
    });
  }

  async remove(id) {
    await questionsAndComments.update({ id }, { $set: { deleted_at: new Date() } });
    return id;
  }

  async create(questionOrComment) {
    const created = await questionsAndComments.insert(questionOrComment);
    return created;
  }
}

module.exports = QuestionsService;
