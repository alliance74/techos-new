const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'techos.db');
const db = new sqlite3.Database(dbPath);

console.log('📊 Checking TechOS Database Users...\n');

db.all('SELECT id, email, first_name, last_name, role, status, org_id, created_at FROM users', [], (err, rows) => {
  if (err) {
    console.error('❌ Error reading database:', err.message);
    db.close();
    return;
  }

  if (rows.length === 0) {
    console.log('⚠️  No users found in database\n');
  } else {
    console.log(`✅ Found ${rows.length} user(s):\n`);
    console.log('═'.repeat(100));
    rows.forEach((user, index) => {
      console.log(`\n👤 User #${index + 1}`);
      console.log(`   ID:         ${user.id}`);
      console.log(`   Email:      ${user.email}`);
      console.log(`   Name:       ${user.first_name} ${user.last_name}`);
      console.log(`   Role:       ${user.role}`);
      console.log(`   Status:     ${user.status}`);
      console.log(`   Org ID:     ${user.org_id}`);
      console.log(`   Created:    ${user.created_at}`);
    });
    console.log('\n' + '═'.repeat(100));

    // Count by role
    const roleCounts = {};
    rows.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });

    console.log('\n📈 Users by Role:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });
  }

  // Also check organizations
  db.all('SELECT id, name, slug, created_at FROM organizations', [], (err, orgs) => {
    if (!err && orgs.length > 0) {
      console.log('\n🏢 Organizations:');
      orgs.forEach((org, index) => {
        console.log(`   ${index + 1}. ${org.name} (${org.slug}) - ID: ${org.id}`);
      });
    }
    console.log('\n');
    db.close();
  });
});
