import cors from 'cors';
import express from 'express';
import notion from './notion';
// hacks
import config from '../config/juicebox/config.juicebox';
import config2 from '../config/dev/config.dev';

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: false }));
app.use(cors({ maxAge: 86400 }));
app.use('/notion', notion);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Started on: http://localhost:${PORT}`);
});
