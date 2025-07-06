#!/usr/bin/env node

/**
 * Cleanup test database after E2E tests
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function cleanupTestDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'file:./test.db'
      }
    }
  });

  try {
    console.log('🧹 Cleaning up test database...');

    // Clean up all test data
    await prisma.purchase.deleteMany();
    await prisma.user.deleteMany();
    await prisma.product.deleteMany();

    console.log('✅ Test data cleaned up successfully');

    // Remove test database file if it exists (SQLite)
    const dbFile = './test.db';
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
      console.log('✅ Test database file removed');
    }

    // Remove other test-related files
    const testFiles = [
      './build.db',
      './playwright-report/',
      './test-results/',
      './coverage/'
    ];

    testFiles.forEach(file => {
      const fullPath = path.resolve(file);
      if (fs.existsSync(fullPath)) {
        if (fs.statSync(fullPath).isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
        console.log(`✅ Removed ${file}`);
      }
    });

    console.log('🎉 Test environment cleanup completed!');

  } catch (error) {
    console.error('❌ Error cleaning up test database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  cleanupTestDatabase();
}

module.exports = { cleanupTestDatabase };