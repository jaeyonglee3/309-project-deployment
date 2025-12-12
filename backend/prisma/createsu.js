/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example: 
 *   node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createSuperuser() {
  const args = process.argv;

  if (args.length !== 5) {
    console.error('Usage: node prisma/createsu.js <utorid> <email> <password>');
    process.exit(1);
  }

  const [, , utorid, email, password] = args;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the superuser
    const superuser = await prisma.user.create({
      data: {
        utorid,
        email,
        password: hashedPassword,
        name: 'Superuser',
        role: 'superuser',
        verified: true,
      },
    });

    console.log(`Superuser created successfully with ID: ${superuser.id}`);
    console.log(`utorid: ${superuser.utorid}`);
    console.log(`email: ${superuser.email}`);
  } catch (error) {
    if (error.code === 'P2002') {
      console.error('Error: A user with this utorid or email already exists.');
    } else {
      console.error('Error creating superuser:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperuser();
