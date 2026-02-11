export interface InvestmentAdvisorInput {
  task_description: string;
  requirements?: string;
}

export async function triggerInvestmentAdvisor(input: InvestmentAdvisorInput): Promise<void> {
  const token = process.env.INFINITE_MINDS_PAT;
  
  if (!token) {
    throw new Error('INFINITE_MINDS_PAT is not set');
  }

  const response = await fetch(
    'https://api.github.com/repos/ceociocto/investment-advisor/actions/workflows/opencode.yml/dispatches',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: input
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to trigger workflow: ${error}`);
  }
}
