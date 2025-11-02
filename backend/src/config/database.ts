import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hr-ai-platform';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
    mongoose.connection.on('error', (err) => { console.error('❌ MongoDB connection error:', err); });
    mongoose.connection.on('disconnected', () => { console.log('⚠️ MongoDB disconnected'); });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};