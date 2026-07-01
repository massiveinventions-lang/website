import { Router } from 'express';
import { config } from '../config';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': req.query.ua ? String(req.query.ua) : 'node-fetch' },
      body: JSON.stringify({ email: config.shiprocket.email, password: config.shiprocket.password })
    });
    const text = await response.text();
    res.json({ status: response.status, body: text, emailUsed: config.shiprocket.email, passLength: config.shiprocket.password?.length });
  } catch (err) {
    res.json({ error: String(err) });
  }
});

export default router;
