const axios = require('axios');
const url = process.argv[2];
if (!url) {
  console.error('Usage: node debug_fetch.js <url>');
  process.exit(2);
}

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function findEmails(obj, path = '') {
  const found = [];
  if (obj === null || obj === undefined) return found;

  if (typeof obj === 'string') {
    const m = obj.match(emailRegex);
    if (m) m.forEach(e => found.push({ path, email: e }));
    return found;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      found.push(...findEmails(item, `${path}[${i}]`));
    });
    return found;
  }

  if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const p = path ? `${path}.${key}` : key;
      found.push(...findEmails(obj[key], p));
    });
    return found;
  }

  return found;
}

(async () => {
  try {
    const res = await axios.get(url, { timeout: 20000, headers: { 'User-Agent': 'HyperEmail-Debug/1.0', Accept: 'application/json, text/html, */*' } });
    console.log('URL:', url);
    console.log('Status:', res.status);
    const ct = res.headers['content-type'] || '';
    console.log('Content-Type:', ct);

    if (ct.includes('application/json') || typeof res.data === 'object') {
      const data = res.data;
      // show top-level keys
      if (data && typeof data === 'object') {
        console.log('\nTop-level keys:', Object.keys(data).slice(0,50));
      }

      const emails = findEmails(data);
      console.log('\nEmails found in JSON (max 50):', emails.slice(0,50));

      // print a small sample of first object
      if (Array.isArray(data)) {
        console.log('\nSample element (0):', JSON.stringify(data[0], null, 2).substring(0, 2000));
      } else if (data && typeof data === 'object') {
        const sample = JSON.stringify(data, null, 2).substring(0, 2000);
        console.log('\nSample JSON (truncated):\n', sample);
      }
    } else {
      const html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      console.log('\nHTML snippet (first 2000 chars):\n', html.substring(0, 2000));
      const mailto = (html.match(/mailto:[^"'<>\s]+/gi) || []).slice(0,20);
      console.log('\nmailto: links found:', mailto);
      const emails = (html.match(emailRegex) || []).slice(0,50);
      console.log('\nEmails found in HTML snippet:', emails);
    }
  } catch (err) {
    if (err.response) {
      console.error('HTTP error', err.response.status, err.response.statusText);
      console.error('Body snippet:', (err.response.data || '').toString().substring(0, 1000));
    } else {
      console.error('Fetch error:', err.message);
    }
    process.exit(1);
  }
})();
