import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyBioCode } from './roblox.js';
import { renderTranscript } from './transcripts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createSite({ store }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.get('/', (_req, res) => res.sendFile(path.resolve(__dirname, 'index.html')));
  app.get('/style.css', (_req, res) => res.type('text/css').sendFile(path.resolve(__dirname, 'style.css')));
  app.get('/cadastro.js', (_req, res) => res.type('application/javascript').sendFile(path.resolve(__dirname, 'cadastro.js')));

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'EB Discord Suite' }));

  app.get('/cadastro/:token', (_req, res) => res.sendFile(path.resolve(__dirname, 'cadastro.html')));

  app.get('/api/register/details', (req, res) => {
    const token = String(req.query.token || '');
    const registration = store.read(data => data.registrations[token] || null);
    if (!registration || registration.usedAt || Date.now() > registration.expiresAt) {
      return res.status(404).json({ error: 'Link expirado ou já utilizado. Gere um novo no Discord.' });
    }
    return res.json({ code: registration.code, expiresAt: registration.expiresAt });
  });

  app.post('/api/register/verify', async (req, res) => {
    try {
      const token = String(req.body.token || '');
      const username = String(req.body.username || '').trim();
      const registration = store.read(data => data.registrations[token] || null);
      if (!registration || registration.usedAt || Date.now() > registration.expiresAt) {
        return res.status(400).json({ error: 'Link expirado ou já utilizado. Gere um novo pelo Discord.' });
      }
      const robloxUser = await verifyBioCode(username, registration.code);
      await store.completeRegistration({
        token,
        robloxUserId: robloxUser.id,
        username: robloxUser.username,
        displayName: robloxUser.displayName
      });
      return res.json({
        ok: true,
        username: robloxUser.username,
        message: 'Conta Roblox vinculada. Volte ao servidor Discord e clique em Verificar para receber seus cargos.'
      });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Não foi possível concluir o cadastro.' });
    }
  });

  app.get('/transcripts/:id', (req, res) => {
    const record = store.getTranscript(req.params.id);
    if (!record) return res.status(404).send('Transcript não encontrado.');
    res.type('html').send(renderTranscript(record));
  });

  app.use((_req, res) => res.status(404).sendFile(path.resolve(__dirname, '404.html')));
  return app;
}
