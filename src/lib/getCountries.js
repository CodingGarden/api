const countriesJSON = require('./countries.json');

let countries;

async function getCountries() {
  if (countries) return countries;
  countries = new Map();
  countriesJSON.forEach((country) => {
    const item = {
      code: country.alpha2Code.toLowerCase(),
      name: country.name,
    };
    countries.set(item.code.toLowerCase(), item);
    countries.set(country.name.toLowerCase(), item);
    country.altSpellings.forEach((alt) => {
      countries.set(alt.toLowerCase(), item);
    });
  });
  return countries;
}

module.exports = getCountries;
