const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Neon.tech dan olgan "Connection String"ingizni shu yerga qo'ying
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_cLpComiEkD98@ep-cool-river-aq43km3f-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

app.post('/api/save', async (req, res) => {
  const { telegram_id, secret_key } = req.body;
  try {
    await pool.query('INSERT INTO scanned_users (telegram_id, secret_key) VALUES ($1, $2)', [telegram_id, secret_key]);
    res.status(200).send('Saqlandi');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/api/get', async (req, res) => {
  const { telegram_id } = req.query;
  try {
    const result = await pool.query('SELECT secret_key FROM scanned_users WHERE telegram_id = $1', [telegram_id]);
    // Mana bu qism frontendga tushunarli bo'ladi:
    res.json({ success: true, secrets: result.rows.map(row => row.secret_key) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Server ishlamoqda'));