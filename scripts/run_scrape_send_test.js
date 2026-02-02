#!/usr/bin/env node
require('dotenv').config();
const axios = require('axios');
const server = process.env.SERVER || 'http://localhost:3000';

async function main() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const pass = process.env.ADMIN_PASS;
    if (!email || !pass) {
      console.error('ADMIN_EMAIL or ADMIN_PASS missing in .env');
      process.exit(2);
    }
    console.log('Login with', email);
    const login = await axios.post(`${server}/api/login`, { email, password: pass }, { headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
    const token = login.data && login.data.token;
    if (!token) {
      console.error('No token in login response:', login.data);
      process.exit(2);
    }
    console.log('Token received (truncated):', token.slice(0, 8) + '...');
    const headers = { Authorization: `Bearer ${token}` };

    const categories = ['justice', 'ministeres', 'prefectures', 'autres'];
    for (const cat of categories) {
      try {
        console.log('\n--- SCRAPE', cat, '---');
        const r = await axios.post(`${server}/api/scrape/${cat}`, {}, { headers, timeout: 120000 });
        console.log('Scrape result:', r.data);
      } catch (e) {
        console.error('Erreur scraping', cat, e.response ? e.response.data : e.message);
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    for (const cat of categories) {
      try {
        console.log('\n--- SEND TEST', cat, '(limit=3) ---');
        const payload = { subject: `[Test] Envoi ${cat}`, message: `Message test pour la catégorie ${cat}`, limit: 3 };
        // server exposes /api/send/:category
        const s = await axios.post(`${server}/api/send/${cat}`, payload, { headers, timeout: 180000 });
        console.log('Send result:', s.data);
      } catch (e) {
        console.error('Erreur send', cat, e.response ? e.response.data : e.message);
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log('\nDone.');
  } catch (e) {
    console.error('Script error:', e.response ? e.response.data : e.message);
    process.exit(2);
  }
}

main();
