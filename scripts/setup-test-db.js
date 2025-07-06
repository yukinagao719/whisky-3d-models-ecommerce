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

    // Clean up existing data in proper order
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.token.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    await prisma.product.deleteMany();

    // Create test products
    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Test Whiskey 1',
          nameEn: 'Test Whiskey 1',
          description: 'A premium test whiskey for E2E testing',
          price: 12000,
          displayOrder: 1,
          imageUrl: '/images/test-whiskey-1.jpg',
          modelUrl: '/models/test-bottle-1.glb',
          videoUrl: '/videos/test-whiskey-1.mp4',
        }
      }),
      prisma.product.create({
        data: {
          name: 'Test Whiskey 2',
          nameEn: 'Test Whiskey 2',
          description: 'Another premium test whiskey',
          price: 15000,
          displayOrder: 2,
          imageUrl: '/images/test-whiskey-2.jpg',
          modelUrl: '/models/test-bottle-2.glb',
          videoUrl: '/videos/test-whiskey-2.mp4',
        }
      }),
      prisma.product.create({
        data: {
          name: 'Out of Stock Whiskey',
          nameEn: 'Out of Stock Whiskey',
          description: 'This whiskey is out of stock for testing',
          price: 18000,
          displayOrder: 3,
          imageUrl: '/images/test-whiskey-3.jpg',
          modelUrl: '/models/test-bottle-3.glb',
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
          hashedPassword: hashedPassword,
          emailVerified: new Date(),
        }
      }),
      prisma.user.create({
        data: {
          name: 'Test Admin',
          email: 'admin@example.com', 
          hashedPassword: hashedPassword,
          emailVerified: new Date(),
        }
      })
    ]);

    console.log(`✅ Created ${users.length} test users`);

    // Create test orders
    const orders = await Promise.all([
      prisma.order.create({
        data: {
          userId: users[0].id,
          orderEmail: users[0].email,
          orderNumber: 'TEST-001',
          status: 'COMPLETED',
          totalAmount: products[0].price,
          isPaid: true,
          paidAt: new Date(),
          items: {
            create: {
              productId: products[0].id,
              name: products[0].name,
              nameEn: products[0].nameEn,
              price: products[0].price,
            }
          }
        }
      })
    ]);

    console.log(`✅ Created ${orders.length} test orders`);

    console.log('🎉 Test database setup completed successfully!');
    console.log('\nTest Data Summary:');
    console.log(`- Products: ${products.length}`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Orders: ${orders.length}`);
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