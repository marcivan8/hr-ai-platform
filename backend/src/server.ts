import express from 'express';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import routes from './routes';
import { connectDB } from './config/database';
import config from './config';
import fs from 'fs';

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors({ origin: config.corsOrigin }));

// ensure uploads dir
const uploads = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploads)) fs.mkdirSync(uploads);
app.use('/uploads', express.static(uploads));

app.use('/api', routes);

connectDB().then(() => {
  app.listen(config.port, () => console.log(`Server running on ${config.port}`));
}).catch((err)=>{
  console.error('DB fail', err);
});