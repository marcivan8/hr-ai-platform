import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://mariojaris2_db_user:<l6vfknRTxDJs7sz2>@cluster0.dt8cyto.mongodb.net/sample_mflix=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
    mongoose.connection.on('error', (err) => { console.error('❌ MongoDB connection error:', err); });
    mongoose.connection.on('disconnected', () => { console.log('⚠️ MongoDB disconnected'); });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};