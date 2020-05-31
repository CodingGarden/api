const axios = require('axios');

let countries;

async function getCountries() {
  if (countries) return countries;
  countries = new Map();
  const { data } = await axios.get('https://restcountries.eu/rest/v2/all?fields=alpha2Code;name;altSpellings;');
  data.forEach((country) => {
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
