import express from 'express';
import session from 'express-session';
import { SiweMessage, generateNonce } from 'siwe';
import store from './helpers/sessionDb';
import { addDaysToDate } from '../utils';

const router = express.Router();

interface Session extends session.Session {
  nonce: string;
  siwe: SiweMessage;
}

router.use(
  session({
    name: 'nance-siwe',
    store,
    resave: true,
    saveUninitialized: false,
    secret: 'somereallysecretsecret',
    cookie: {
      sameSite: 'none',
      secure: true,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: 'https://jbdao-org-git-nextauth-juicetool.vercel.app'
    }
  })
);

router.get('/nonce', (_, res) => {
  const nonce = generateNonce();
  return res.send(nonce);
});

router.post('/verify', async (req, res) => {
  const sesh = req.session as Session;
  if (!req.body.message) {
    res.status(422).json({ message: 'Expected prepareMessage object as body.' });
    return;
  }
  const SIWEObject = new SiweMessage(req.body.message);
  const { data: message } = await SIWEObject.verify({ signature: req.body.signature, nonce: sesh.nonce });
  sesh.siwe = message;
  sesh.cookie.expires = addDaysToDate(new Date(), 7);
  sesh.save(() => {
    res.json({ success: true, data: 'Successfully verified signature.' });
  });
});

router.get('/status', (req, res) => {
  const origin = req.headers.origin || req.headers.referer;
  console.log('Request Origin:', origin);
  const sesh = req.session as Session;
  if (!sesh.siwe) {
    res.json({ success: false, data: 'unauthenticated' });
    return;
  }
  res.json({ success: true, data: sesh.siwe });
});

export default router;
