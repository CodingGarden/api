const axios = require('axios');

let countries;

async function getCountries() {
  if (countries) return countries;
  countries = (async () => {
    const { data } = await axios.get('https://iso-3166-flags.netlify.app/dist/metadata.json');
    const result = new Map();
    data.forEach((info) => {
      const item = {
        code: info.route,
        name: info.name,
      };
      result.set(item.code, item);
    });
    return result;
  })();
  return countries;
}

module.exports = getCountries;
