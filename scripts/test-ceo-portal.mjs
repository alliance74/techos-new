/**
 * CEO portal integration smoke test.
 * Usage (PowerShell): node scripts/test-ceo-portal.mjs
 */
const API = process.env.API_URL || 'http://localhost:4000/api';

async function req(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const results = [];
  const log = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  };

  try {
    const login = await req('POST', '/auth/login', null, {
      email: 'ceo@gmail.com',
      password: 'Ceo@2026',
    });
    assert(login.ok && login.json?.data?.token, 'CEO login failed');
    const token = login.json.data.token;
    log('Login as CEO', true);

    const checks = [
      ['GET', '/dashboard/executive'],
      ['GET', '/projects'],
      ['GET', '/crm/contacts'],
      ['GET', '/crm/deals'],
      ['GET', '/finance/invoices'],
      ['GET', '/finance/expenses'],
      ['GET', '/finance/budgets'],
      ['GET', '/hr/employees'],
      ['GET', '/meetings'],
      ['GET', '/goals'],
      ['GET', '/documents'],
      ['GET', '/announcements'],
      ['GET', '/product/features'],
      ['GET', '/product/bugs'],
      ['GET', '/calendar/events'],
      ['GET', '/channels'],
      ['GET', '/workspace/campaigns'],
      ['GET', '/workspace/processes'],
      ['GET', '/workspace/activity'],
    ];

    for (const [method, path] of checks) {
      const r = await req(method, path, token);
      log(`${method} ${path}`, r.ok, `status=${r.status}`);
    }

    // Create flows
    const project = await req('POST', '/projects', token, {
      name: 'CEO Portal Integration Project',
      description: 'Created by smoke test',
      priority: 'high',
    });
    log('Create project', project.ok, project.ok ? project.json?.data?.id : JSON.stringify(project.json));
    const projectId = project.json?.data?.id;

    const contact = await req('POST', '/crm/contacts', token, {
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: `ada.${Date.now()}@example.com`,
      type: 'lead',
      status: 'active',
    });
    log('Create contact', contact.ok);

    const deal = await req('POST', '/crm/deals', token, {
      title: 'Enterprise deal',
      value: 25000,
      stage: 'qualification',
    });
    log('Create deal', deal.ok, deal.ok ? '' : JSON.stringify(deal.json));

    const invoice = await req('POST', '/finance/invoices', token, {
      amount: 1200,
      total: 1200,
      description: 'Consulting',
    });
    log('Create invoice', invoice.ok, invoice.ok ? '' : JSON.stringify(invoice.json));

    const campaign = await req('POST', '/workspace/campaigns', token, {
      title: 'Q3 Launch Campaign',
      description: 'Marketing push',
      status: 'active',
      owner: 'Alex CEO',
    });
    log('Create campaign (workspace)', campaign.ok);
    const campaignId = campaign.json?.data?.id;

    const event = await req('POST', '/calendar/events', token, {
      title: 'Board sync',
      start_datetime: new Date(Date.now() + 3600000).toISOString(),
      end_datetime: new Date(Date.now() + 7200000).toISOString(),
      type: 'meeting',
    });
    log('Create calendar event', event.ok, event.ok ? '' : JSON.stringify(event.json));

    const meeting = await req('POST', '/meetings', token, {
      title: 'Weekly ops',
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      start_time: '10:00',
      end_time: '11:00',
      description: 'Ops sync',
    });
    log('Create meeting', meeting.ok, meeting.ok ? '' : JSON.stringify(meeting.json));

    if (campaignId) {
      const updated = await req('PUT', `/workspace/campaigns/${campaignId}`, token, {
        title: 'Q3 Launch Campaign (updated)',
        status: 'completed',
      });
      log('Update campaign', updated.ok);

      const activity = await req('GET', `/workspace/activity?entity_type=campaigns&entity_id=${campaignId}`, token);
      log('Activity feed for campaign', activity.ok && Array.isArray(activity.json?.data));

      const deleted = await req('DELETE', `/workspace/campaigns/${campaignId}`, token);
      log('Delete campaign', deleted.ok);
    }

    if (projectId) {
      const del = await req('DELETE', `/projects/${projectId}`, token);
      log('Delete project', del.ok);
    }

    const invite = await req('POST', '/users', token, {
      email: `invitee.${Date.now()}@techos.io`,
      firstName: 'Invite',
      lastName: 'Test',
      role: 'software_engineer',
      department: 'Engineering',
      position: 'Engineer',
    });
    log('Invite user from HR flow', invite.ok && !!invite.json?.data?.temporary_password);

    const failed = results.filter((r) => !r.ok);
    console.log('\n--- Summary ---');
    console.log(`Passed: ${results.filter((r) => r.ok).length}/${results.length}`);
    if (failed.length) {
      console.log('Failures:');
      failed.forEach((f) => console.log(` - ${f.name}: ${f.detail}`));
      process.exit(1);
    }
    console.log('CEO portal API smoke test passed.');
  } catch (err) {
    console.error('Smoke test crashed:', err.message);
    process.exit(1);
  }
}

main();
