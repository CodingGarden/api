const {
  fontAwesome,
  simpleIcons,
} = require('../../lib/getIcons');

class IconsService {
  async find() {
    return {
      fontAwesome: [...fontAwesome],
      simpleIcons: [...simpleIcons],
    };
  }
}

module.exports = IconsService;
