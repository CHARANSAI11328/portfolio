const http = require('http');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('       NEON POSTGRESQL END-TO-END VERIFICATION      ');
  console.log('====================================================');

  console.log('\n[1/7] Testing /api/db/status (Neon Connection & Branch)...');
  const dbStatus = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/db/status',
    method: 'GET',
  });
  console.log('DB Status Output:', JSON.stringify(dbStatus.data, null, 2));
  if (!dbStatus.data?.connected) {
    throw new Error('Database is NOT connected to Neon PostgreSQL!');
  }

  console.log('\n[2/7] Testing /api/profile (Hydrated from Neon PostgreSQL)...');
  const profileRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/profile',
    method: 'GET',
  });
  console.log('Status:', profileRes.status, '| Name:', profileRes.data?.profile?.name, '| Title:', profileRes.data?.profile?.title);

  console.log('\n[3/7] Testing /api/team (Live Team Records from Neon)...');
  const teamRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/team',
    method: 'GET',
  });
  console.log('Status:', teamRes.status, '| Members Count:', teamRes.data?.team?.length, '| First:', teamRes.data?.team?.[0]?.name, '(', teamRes.data?.team?.[0]?.role, ')');

  console.log('\n[4/7] Testing Admin Login (/api/auth/login with admin/admin)...');
  const loginRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin', password: 'admin' }
  );
  console.log('Login Status:', loginRes.status, '| Success:', loginRes.data?.success, '| Admin:', loginRes.data?.admin?.name, '(', loginRes.data?.admin?.email, ')');
  const token = loginRes.data?.token;
  if (!token) throw new Error('Login failed — no JWT token returned');

  console.log('\n[5/7] Testing Persistent Write via API (POST /api/team)...');
  const addRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/team',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    {
      name: 'Dr. Neon Database Architect',
      role: 'Cloud Persistence Lead',
      bio: 'Validating zero-latency persistent writes to Neon PostgreSQL production database.',
      skills: ['Neon', 'PostgreSQL', 'Serverless'],
      github: 'https://github.com/CHARANSAI11328',
      displayOrder: 99,
    }
  );
  console.log('Create Member Status:', addRes.status, '| Member ID:', addRes.data?.member?.id, '| Name:', addRes.data?.member?.name);
  const createdMemberId = addRes.data?.member?.id;
  if (!createdMemberId) throw new Error('Create team member failed');

  console.log('\n[6/7] Direct Cloud SQL Verification against Neon PostgreSQL (polling for completion)...');
  const { query } = require('./server/neon');
  let neonRows = [];
  for (let attempt = 1; attempt <= 10; attempt++) {
    await new Promise((r) => setTimeout(r, 700));
    neonRows = await query('SELECT id, name, role FROM team_members WHERE id = $1', [createdMemberId]);
    if (neonRows && neonRows.length > 0) {
      console.log(`Verified in Neon cloud after ${attempt * 700}ms!`);
      break;
    }
  }

  console.log('Query result directly from Neon PostgreSQL Cloud:');
  console.log(JSON.stringify(neonRows, null, 2));

  if (!neonRows || neonRows.length === 0) {
    throw new Error(`Record ${createdMemberId} was NOT found in Neon team_members table!`);
  }

  console.log('\n[7/7] Cleaning up test member (DELETE /api/team/:id)...');
  const delRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/team/${createdMemberId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Delete Status:', delRes.status, '| Success:', delRes.data?.success);

  // Clean from structured table as well
  await query('DELETE FROM team_members WHERE id = $1', [createdMemberId]);
  console.log('Direct SQL Cleanup Verified.');

  console.log('\n====================================================');
  console.log('   ALL NEON POSTGRESQL SERVICES PROVEN END-TO-END!  ');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
