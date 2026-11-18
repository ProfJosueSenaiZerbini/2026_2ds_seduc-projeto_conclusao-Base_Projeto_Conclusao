import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',

  // Com o paralelismo padrão o Firefox cai e há timeouts por sobrecarga; 2 workers rodam a suíte estável.
  workers: 2,

  // No GitHub Actions também gera o relatório HTML (playwright-report/), publicado como artifact se falhar.
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',

  // O próprio Playwright sobe o servidor com o CEP falso (CEP_FAKE=1): a publicação de bicos verifica o
  // endereço pelo CEP e, assim, os testes não dependem da ViaCEP/BrasilAPI nem de internet.
  // reuseExistingServer: false garante esse modo — se já houver um servidor na porta 3000 (ex.: npm run dev),
  // pare-o antes de rodar `npm test`. NODE_ENV=development é exigido pelo cadastro dos testes (CPFs fictícios).
  webServer: {
    command: 'node app.js',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      PORT: '3000',
      NODE_ENV: 'development',
      CEP_FAKE: '1',
    },
  },

  projects: [
    
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        browserName: 'firefox',
        headless: true,
      },
    },
  ],
});
