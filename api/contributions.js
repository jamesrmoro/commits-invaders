// api/contributions.js
const fetch = require('node-fetch'); // versão 2.x

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

module.exports = async (req, res) => {
  const { user = 'jamesrmoro' } = req.query;

  const query = `
    query {
      user(login: "${user}") {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (data.errors || !data.data?.user?.contributionsCollection?.contributionCalendar?.weeks) {
      return res.status(500).json({ error: 'Erro ao buscar dados do GitHub' });
    }

    res.status(200).json(data.data.user.contributionsCollection.contributionCalendar.weeks);
  } catch (err) {
    console.error('Erro ao buscar contribuições:', err);
    res.status(500).json({ error: 'Erro ao buscar contribuições' });
  }
};
