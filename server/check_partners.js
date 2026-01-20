
const mongoose = require('mongoose');
const Partner = require('./src/models/Partner');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function checkPartner() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const key = 'acp_8ba28e18_5968e84e0579411bbae50897f9c4d447';
    // We need to check if we store the hash or the key itself.
    // Based on previous context, we might store a hash.
    // But let's check the Partner model first or just dump all partners to see what's there.
    
    const partners = await Partner.find({});
    console.log(`Found ${partners.length} partners.`);
    
    partners.forEach(p => {
        console.log(`Partner: ${p.name}, API Key (stored): ${p.apiKey}, Status: ${p.status}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkPartner();
