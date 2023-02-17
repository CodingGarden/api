const axios = require('axios');

const query = `query {
  organization(login:"CodingGarden") {
    ... on Sponsorable {
      monthlyEstimatedSponsorsIncomeInCents
      sponsors(first: 100) {
        totalCount
        nodes {
          ... on User {
            login
            avatarUrl
            sponsorshipsAsSponsor(first: 100) {
              totalRecurringMonthlyPriceInCents
              nodes {
                createdAt
                tier {
                  isCustomAmount
                  monthlyPriceInCents
                }
                isOneTimePayment
                isActive
                privacyLevel
              }
            }
          }
          ... on Organization {
            login
            avatarUrl
            sponsorshipsAsSponsor(first: 100) {
              totalRecurringMonthlyPriceInCents
              nodes {
                createdAt
                tier {
                  isCustomAmount
                  monthlyPriceInCents
                }
                isOneTimePayment
                isActive
                privacyLevel
              }
            }
          }
        }
      }
    }
  }
}`;

async function getSponsors() {
  const { data } = await axios.post('https://api.github.com/graphql', { query }, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
    }
  });
  const monthlySponsors = [];
  const oneTimeSponsors = [];

  data.data.organization.sponsors.nodes.forEach((sponsor) => {
    const info = {
      login: sponsor.login,
      avatarUrl: sponsor.avatarUrl,
    };
    const sponsorship = sponsor.sponsorshipsAsSponsor.nodes[0];
    info.amount = sponsorship.tier.monthlyPriceInCents;
    info.private = sponsorship.privacyLevel === 'PRIVATE';
    if (sponsorship.isOneTimePayment) {
      oneTimeSponsors.push(info);
    } else {
      monthlySponsors.push(info);
    }
  });

  return {
    monthlyCount: monthlySponsors.length,
    monthlyIncomeTotal: data.data.organization.monthlyEstimatedSponsorsIncomeInCents,
    monthlySponsors,
    oneTimeSponsors,
  };
}

module.exports = {
  getSponsors,
};
