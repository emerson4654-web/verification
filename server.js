import 'dotenv/config';
import { Store } from './store.js';
import { createSite } from './site.js';

const port = Number(process.env.PORT || 3000);
const dataFile = process.env.DATA_FILE || './eb-suite-data.json';

async function main() {
  const store = new Store(dataFile);
  await store.init();

  const app = createSite({ store });
  app.listen(port, '0.0.0.0', () => {
    console.log(`[EB Site] Portal disponível na porta ${port}.`);
  });
}

main().catch(error => {
  console.error('[EB Site] Erro ao iniciar:', error);
  process.exit(1);
});
