const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function seedTestData() {
  console.log('🌱 Starting test data seeding...\n');

  try {
    // 1. Login as CEO
    console.log('📝 Logging in as CEO...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'ceo@gmail.com',
      password: 'Ceo@2026'
    });
    
    const { token, user } = loginRes.data.data;
    const headers = { Authorization: `Bearer ${token}` };
    const orgId = user.org_id;
    const userId = user.id;
    
    console.log(`✅ Logged in successfully`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Org ID: ${orgId}\n`);

    // 2. Create Projects
    console.log('📁 Creating projects...');
    const projects = [
      { name: 'Mobile App Redesign', description: 'Modernize our mobile application', status: 'active', priority: 'high' },
      { name: 'API v2 Migration', description: 'Migrate to new API architecture', status: 'active', priority: 'high' },
      { name: 'Security Audit', description: 'Comprehensive security review', status: 'active', priority: 'critical' },
    ];

    const createdProjects = [];
    for (const project of projects) {
      const res = await axios.post(`${API_BASE}/projects`, project, { headers });
      createdProjects.push(res.data.data);
      console.log(`   ✅ Created: ${project.name}`);
    }

    // 3. Create Tasks
    console.log('\n📋 Creating tasks...');
    const tasks = [
      { title: 'Design new login screen', project_id: createdProjects[0].id, status: 'in_progress', priority: 'high', assignee_id: userId, reporter_id: userId },
      { title: 'Implement dark mode', project_id: createdProjects[0].id, status: 'todo', priority: 'medium', assignee_id: userId, reporter_id: userId },
      { title: 'Update API documentation', project_id: createdProjects[1].id, status: 'in_progress', priority: 'high', assignee_id: userId, reporter_id: userId },
      { title: 'Migrate user endpoints', project_id: createdProjects[1].id, status: 'done', priority: 'high', assignee_id: userId, reporter_id: userId },
      { title: 'Penetration testing', project_id: createdProjects[2].id, status: 'in_progress', priority: 'critical', assignee_id: userId, reporter_id: userId },
    ];

    for (const task of tasks) {
      await axios.post(`${API_BASE}/tasks`, task, { headers });
      console.log(`   ✅ Created: ${task.title}`);
    }

    // 4. Create Calendar Events
    console.log('\n📅 Creating calendar events...');
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const events = [
      { 
        title: 'Sprint Planning Meeting', 
        description: 'Plan next sprint goals and tasks',
        start_datetime: new Date(now.setHours(10, 0, 0)).toISOString(),
        end_datetime: new Date(now.setHours(11, 0, 0)).toISOString(),
        type: 'meeting',
        attendees: [userId]
      },
      { 
        title: 'Product Demo', 
        description: 'Demo new features to stakeholders',
        start_datetime: new Date(tomorrow.setHours(14, 0, 0)).toISOString(),
        end_datetime: new Date(tomorrow.setHours(15, 0, 0)).toISOString(),
        type: 'meeting',
        attendees: [userId]
      },
      { 
        title: 'Quarterly Review', 
        description: 'Q3 2026 Performance Review',
        start_datetime: new Date(nextWeek.setHours(9, 0, 0)).toISOString(),
        end_datetime: new Date(nextWeek.setHours(11, 0, 0)).toISOString(),
        type: 'meeting',
        attendees: [userId]
      },
    ];

    for (const event of events) {
      await axios.post(`${API_BASE}/calendar/events`, event, { headers });
      console.log(`   ✅ Created: ${event.title}`);
    }

    // 5. Create Goals
    console.log('\n🎯 Creating goals...');
    const goals = [
      { title: 'Increase Mobile User Adoption', description: 'Grow mobile app users by 50%', type: 'company', owner_id: userId },
      { title: 'Improve API Performance', description: 'Reduce average API response time to <100ms', type: 'product', owner_id: userId },
      { title: 'Achieve SOC 2 Compliance', description: 'Complete SOC 2 Type II audit', type: 'compliance', owner_id: userId },
    ];

    for (const goal of goals) {
      await axios.post(`${API_BASE}/goals`, goal, { headers });
      console.log(`   ✅ Created: ${goal.title}`);
    }

    // 6. Create Contacts (CRM)
    console.log('\n💼 Creating CRM contacts...');
    const contacts = [
      { first_name: 'John', last_name: 'Smith', email: 'john.smith@example.com', company_name: 'Acme Corp', type: 'customer' },
      { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@startup.io', company_name: 'Startup Inc', type: 'lead' },
      { first_name: 'Mike', last_name: 'Chen', email: 'mike@enterprise.com', company_name: 'Enterprise LLC', type: 'customer' },
    ];

    const createdContacts = [];
    for (const contact of contacts) {
      const res = await axios.post(`${API_BASE}/crm/contacts`, contact, { headers });
      createdContacts.push(res.data.data);
      console.log(`   ✅ Created: ${contact.first_name} ${contact.last_name}`);
    }

    // 7. Create Deals
    console.log('\n💰 Creating deals...');
    const deals = [
      { title: 'Enterprise Plan Upgrade', value: 50000, stage: 'proposal', probability: 70, contact_id: createdContacts[0].id, assigned_to: userId, currency: 'USD' },
      { title: 'Annual Subscription', value: 12000, stage: 'negotiation', probability: 90, contact_id: createdContacts[1].id, assigned_to: userId, currency: 'USD' },
      { title: 'Premium Features Add-on', value: 5000, stage: 'closed_won', probability: 100, contact_id: createdContacts[2].id, assigned_to: userId, currency: 'USD' },
    ];

    for (const deal of deals) {
      await axios.post(`${API_BASE}/crm/deals`, deal, { headers });
      console.log(`   ✅ Created: ${deal.title} ($${deal.value})`);
    }

    // 8. Create Announcements
    console.log('\n📢 Creating announcements...');
    const announcements = [
      { title: 'New Product Launch', content: 'Excited to announce our latest product update with AI features!', priority: 'high' },
      { title: 'Team Offsite Next Month', content: 'Save the date for our quarterly team offsite on September 15th', priority: 'normal' },
    ];

    for (const announcement of announcements) {
      await axios.post(`${API_BASE}/announcements`, announcement, { headers });
      console.log(`   ✅ Created: ${announcement.title}`);
    }

    console.log('\n\n✅ Test data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - 3 Projects`);
    console.log(`   - 5 Tasks`);
    console.log(`   - 3 Calendar Events`);
    console.log(`   - 3 Goals`);
    console.log(`   - 3 Contacts`);
    console.log(`   - 3 Deals`);
    console.log(`   - 2 Announcements`);
    console.log('\n🎉 PostgreSQL database ready for testing!');

  } catch (error) {
    console.error('❌ Error seeding data:', error.response?.data || error.message);
    process.exit(1);
  }
}

seedTestData();
