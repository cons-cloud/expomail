const db = require('../db');
const bcrypt = require('bcryptjs');

async function main() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL;
  const pass = process.argv[3] || process.env.ADMIN_PASS;
  if (!email || !pass) {
    console.error('Usage: node create_admin_temp.js <email> <password>');
    process.exit(2);
  }
  try {
    const hash = await bcrypt.hash(pass, 10);
    const existing = await db.getUserByEmail(email);
    if (existing) {
      console.log('User exists, ensuring admin:', existing.id);
      await db.setAdmin(existing.id);
      console.log('Admin privileges set for', email);
      process.exit(0);
    }
    const id = await db.createUser(email, hash);
    await db.setAdmin(id);
    console.log('Admin user created:', email, 'id=', id);
    process.exit(0);
  } catch (e) {
    console.error('Error creating admin:', e && e.message);
    process.exit(1);
  }
}

main();
