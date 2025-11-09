import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import adminsRouter from './routes/admins.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/gemini-ai', adminsRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/`);
});

