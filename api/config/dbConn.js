const prisma = require('../prisma/client')

const connectDB = async () => {
  await prisma.$connect()
  console.log('Connected to PostgreSQL')
  return prisma
}

module.exports = connectDB
