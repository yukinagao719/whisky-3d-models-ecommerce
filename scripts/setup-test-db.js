#!/usr/bin/env node

/**
 * Setup test database with seed data for E2E tests
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function setupTestDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'file:./test.db'
      }
    }
  });

  try {
    console.log('🗄️  Setting up test database...');

    // Clean up existing data
    await prisma.purchase.deleteMany();
    await prisma.user.deleteMany();
    await prisma.product.deleteMany();

    // Create test products
    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Test Whiskey 1',
          slug: 'test-whiskey-1',
          description: 'A premium test whiskey for E2E testing',
          price: 12000,
          modelUrl: '/models/test-bottle-1.glb',
          images: ['/images/test-whiskey-1.jpg'],
          featured: true,
          inStock: true,
        }
      }),
      prisma.product.create({
        data: {
          name: 'Test Whiskey 2', 
          slug: 'test-whiskey-2',
          description: 'Another premium test whiskey',
          price: 15000,
          modelUrl: '/models/test-bottle-2.glb',
          images: ['/images/test-whiskey-2.jpg'],
          featured: false,
          inStock: true,
        }
      }),
      prisma.product.create({
        data: {
          name: 'Out of Stock Whiskey',
          slug: 'out-of-stock-whiskey',
          description: 'This whiskey is out of stock for testing',
          price: 18000,
          modelUrl: '/models/test-bottle-3.glb',
          images: ['/images/test-whiskey-3.jpg'],
          featured: false,
          inStock: false,
        }
      })
    ]);

    console.log(`✅ Created ${products.length} test products`);

    // Create test users
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword,
          emailVerified: new Date(),
        }
      }),
      prisma.user.create({
        data: {
          name: 'Test Admin',
          email: 'admin@example.com', 
          password: hashedPassword,
          emailVerified: new Date(),
        }
      })
    ]);

    console.log(`✅ Created ${users.length} test users`);

    // Create test purchases
    const purchases = await Promise.all([
      prisma.purchase.create({
        data: {
          userId: users[0].id,
          productId: products[0].id,
          sessionId: 'test_session_1',
        }
      })
    ]);

    console.log(`✅ Created ${purchases.length} test purchases`);

    console.log('🎉 Test database setup completed successfully!');
    console.log('\nTest Data Summary:');
    console.log(`- Products: ${products.length}`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Purchases: ${purchases.length}`);
    console.log('\nTest User Credentials:');
    console.log('Email: test@example.com');
    console.log('Password: testpassword123');

  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  setupTestDatabase();
}

module.exports = { setupTestDatabase };