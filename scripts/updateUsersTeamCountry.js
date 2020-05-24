const app = require('../src/app');
const users = require('./users.json');
const getBrands = require('../src/lib/getBrands');
const getCountries = require('../src/lib/getCountries');

async function updateUsersTeamCountry() {
  try {
    const brands = getBrands();
    const countries = await getCountries();
    const results = await Promise.all(
      Object.entries(users).map(async ([username, info]) => {
        const updates = {};
        const country = countries.get(info.country_code);
        if (info.country_code) {
          updates.country = country;
        }
        if (info.team && brands.has(info.team)) {
          updates.team = info.team;
        }
        if (!Object.keys(updates).length) {
          updates.country = null;
          updates.team = null;
        }
        await app.service('twitch/users').patch(username, updates);
      })
    );
    console.log('updated', results.length);
  } catch (error) {
    console.error(error);
  }
}

updateUsersTeamCountry();
