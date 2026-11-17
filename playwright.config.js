import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',

  // Com o paralelismo padrão o Firefox cai e há timeouts por sobrecarga; 2 workers rodam a suíte estável.
  workers: 2,

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
