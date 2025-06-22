const GitHubAPI = {
  /**
   * Obtém contribuições públicas do usuário via API local que usa GitHub GraphQL
   * @param {string} username - Nome de usuário do GitHub
   * @returns {Promise<Array<{date: string, count: number, color: string}>>}
   */
  async getUserContributions(username) {
    try {
      const res = await fetch(`/api/contributions?user=${username}`);
      if (!res.ok) throw new Error('Falha ao buscar dados da API local');

      const weeks = await res.json();

      if (!Array.isArray(weeks)) {
        throw new Error('Formato de dados inesperado');
      }

      const days = weeks.flatMap(week => week.contributionDays);

      if (!days || days.length === 0) {
        throw new Error('Nenhuma contribuição encontrada');
      }

      return days.map(day => ({
        date: day.date,
        count: day.contributionCount,
        color: day.color
      }));
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      throw new Error('Erro ao carregar dados do GitHub');
    }
  }
};
