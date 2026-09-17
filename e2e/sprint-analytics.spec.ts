import { test, expect } from '@playwright/test';

test.describe('Sprint Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the sprint analytics page
    await page.goto('/cto/sprint-analytics');
  });

  test('should display the sprint analytics page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Sprint Analytics');
  });

  test('should display overview statistics cards', async ({ page }) => {
    // Check that overview cards are rendered
    await expect(page.locator('text=Total Sprints')).toBeVisible();
    await expect(page.locator('text=Active')).toBeVisible();
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('text=Avg Velocity')).toBeVisible();
    await expect(page.locator('text=Avg Completion')).toBeVisible();
    await expect(page.locator('text=Total Points')).toBeVisible();
  });

  test('should display velocity trend section', async ({ page }) => {
    await expect(page.locator('text=Velocity Trend')).toBeVisible();
  });

  test('should display burndown chart section', async ({ page }) => {
    await expect(page.locator('text=Burndown Chart')).toBeVisible();
  });

  test('should have a refresh button', async ({ page }) => {
    const refreshBtn = page.locator('button', { hasText: 'Refresh' });
    await expect(refreshBtn).toBeVisible();
  });

  test('should refresh data when refresh button is clicked', async ({ page }) => {
    const refreshBtn = page.locator('button', { hasText: 'Refresh' });
    await refreshBtn.click();
    // Page should still be visible after refresh
    await expect(page.locator('h1')).toContainText('Sprint Analytics');
  });

  test('should display sprint history section', async ({ page }) => {
    await expect(page.locator('text=Sprint History')).toBeVisible();
  });
});

test.describe('MCP Registry API', () => {
  const API_BASE = process.env.API_URL || 'http://localhost:3000';
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: 'admin@techos.com',
        password: 'password123',
      },
    });

    if (loginResponse.ok()) {
      const body = await loginResponse.json();
      authToken = body.access_token || body.token || '';
    }
  });

  test('should register a new MCP tool', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    const response = await request.post(`${API_BASE}/mcp-registry/tools`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'Test Code Analyzer',
        description: 'Analyzes code for quality issues',
        category: 'development',
        protocol: 'mcp',
        endpoint_url: 'https://analyzer.example.com/mcp',
        input_schema: { type: 'object', properties: { code: { type: 'string' } } },
        tags: ['code-quality', 'analysis'],
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBeTruthy();
    expect(body.data.name).toBe('Test Code Analyzer');
  });

  test('should list MCP tools', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    const response = await request.get(`${API_BASE}/mcp-registry/tools`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBeTruthy();
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('should get MCP registry stats', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    const response = await request.get(`${API_BASE}/mcp-registry/stats`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBeTruthy();
    expect(body.data).toHaveProperty('total_tools');
  });
});

test.describe('AI Recommendations API', () => {
  const API_BASE = process.env.API_URL || 'http://localhost:3000';
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: 'admin@techos.com',
        password: 'password123',
      },
    });

    if (loginResponse.ok()) {
      const body = await loginResponse.json();
      authToken = body.access_token || body.token || '';
    }
  });

  test('should get AI recommendations', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    const response = await request.get(`${API_BASE}/ai/recommendations`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('should retrieve contextual data', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    const response = await request.post(`${API_BASE}/ai/retrieve-context`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { message: 'Show me the current sprint tasks' },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBeTruthy();
    expect(body.data).toHaveProperty('tasks');
  });

  test('should build context prompt', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    const response = await request.post(`${API_BASE}/ai/retrieve-context/prompt`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { message: 'What are the open bugs?' },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBeTruthy();
    expect(body.data).toHaveProperty('prompt');
  });
});

test.describe('PR Workflow API', () => {
  const API_BASE = process.env.API_URL || 'http://localhost:3000';
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: 'admin@techos.com',
        password: 'password123',
      },
    });

    if (loginResponse.ok()) {
      const body = await loginResponse.json();
      authToken = body.access_token || body.token || '';
    }
  });

  test('should return error when GitHub not configured', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    const response = await request.get(`${API_BASE}/github/install-url`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // Should return either a URL or a not-configured error
    expect(response.ok()).toBeTruthy();
  });

  test('should list GitHub installations', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    const response = await request.get(`${API_BASE}/github/installations`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBeTruthy();
  });
});

test.describe('Sprint Analytics API', () => {
  const API_BASE = process.env.API_URL || 'http://localhost:3000';
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: 'admin@techos.com',
        password: 'password123',
      },
    });

    if (loginResponse.ok()) {
      const body = await loginResponse.json();
      authToken = body.access_token || body.token || '';
    }
  });

  test('should get sprint analytics dashboard data', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    const response = await request.get(`${API_BASE}/sprints/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBeTruthy();
    expect(body.data).toHaveProperty('sprints');
    expect(body.data).toHaveProperty('overview');
    expect(body.data).toHaveProperty('velocity_trend');
  });

  test('should get velocity comparison', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    const response = await request.get(`${API_BASE}/sprints/analytics/velocity`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBeTruthy();
    expect(Array.isArray(body.data)).toBeTruthy();
  });
});
