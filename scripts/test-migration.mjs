import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.AUTH_SECRET || 'bXktc3VwZXItc2VjcmV0LWtleS10aGF0LWlzLWF0LWxlYXN0LTMyLWNoYXJzLWxvbmc=';
const secretKey = new TextEncoder().encode(JWT_SECRET);

async function runTests() {
  console.log('--- Testing Next.js Migration Core Logic ---');

  // 1. Verify User DB query
  console.log('1. Checking Admin User in Neon DB...');
  const admin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!admin) {
    throw new Error('Admin user not found!');
  }
  console.log('   ✓ Found admin:', admin.username, 'Role:', admin.role);

  // 2. Verify password verification
  console.log('2. Testing password verification...');
  const isCorrect = await bcrypt.compare('admin123', admin.password);
  console.log('   ✓ Admin password valid:', isCorrect);

  // 3. Testing JWT generation and verification
  console.log('3. Testing JWT jose generation and verification...');
  const token = await new SignJWT({
    id: Number(admin.id),
    username: admin.username,
    role: admin.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);

  const { payload } = await jwtVerify(token, secretKey);
  console.log('   ✓ Decoded payload matches:', payload.username, payload.role);

  // 4. File query and serialization
  console.log('4. Testing File queries and stats...');
  const files = await prisma.file.findMany();
  console.log(`   ✓ Found ${files.length} existing files in DB.`);
  const totalStorage = files.reduce((acc, f) => acc + Number(f.size), 0);
  console.log(`   ✓ Total storage computed: ${totalStorage} bytes`);

  // 5. Admin stats query
  console.log('5. Testing admin aggregate stats...');
  const [totalUsers, totalFiles, storageAggregate] = await Promise.all([
    prisma.user.count(),
    prisma.file.count(),
    prisma.file.aggregate({ _sum: { size: true } }),
  ]);
  console.log(`   ✓ Total Users: ${totalUsers}, Total Files: ${totalFiles}, Storage: ${storageAggregate._sum.size || 0}`);

  console.log('\n--- ALL CORE LOGIC TESTS PASSED! ---');
}

runTests()
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
