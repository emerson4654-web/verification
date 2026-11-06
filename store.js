import fs from 'node:fs/promises';
import path from 'node:path';

const emptyData = () => ({
  users: {},
  registrations: {},
  tickets: {},
  counters: {},
  transcripts: {},
  panelMessages: {}
});

export class Store {
  constructor(filePath) {
    this.filePath = path.resolve(filePath || './data/store.json');
    this.data = emptyData();
    this.queue = Promise.resolve();
  }

  async init() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      this.data = { ...emptyData(), ...parsed };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await this.#persist();
    }
  }

  async #persist() {
    const temp = `${this.filePath}.tmp`;
    await fs.writeFile(temp, JSON.stringify(this.data, null, 2), 'utf8');
    await fs.rename(temp, this.filePath);
  }

  read(fn) {
    return fn(structuredClone(this.data));
  }

  update(fn) {
    const task = this.queue.then(async () => {
      const result = await fn(this.data);
      await this.#persist();
      return structuredClone(result);
    });
    this.queue = task.catch(() => {});
    return task;
  }

  async issueRegistration({ token, code, discordId, expiresAt }) {
    return this.update(data => {
      for (const [oldToken, item] of Object.entries(data.registrations)) {
        if (item.discordId === discordId && !item.usedAt) delete data.registrations[oldToken];
      }
      data.registrations[token] = { token, code, discordId, expiresAt, usedAt: null };
      return data.registrations[token];
    });
  }

  async completeRegistration({ token, robloxUserId, username, displayName }) {
    return this.update(data => {
      const registration = data.registrations[token];
      if (!registration || registration.usedAt || Date.now() > registration.expiresAt) {
        throw new Error('Este link de cadastro expirou ou já foi utilizado. Gere outro pelo Discord.');
      }
      const existing = data.users[registration.discordId];
      const linkedToOther = Object.entries(data.users).find(([discordId, user]) =>
        discordId !== registration.discordId && String(user.robloxUserId) === String(robloxUserId)
      );
      if (linkedToOther) throw new Error('Essa conta Roblox já está vinculada a outro usuário Discord.');
      data.users[registration.discordId] = {
        discordId: registration.discordId,
        robloxUserId: String(robloxUserId),
        username,
        displayName,
        verifiedAt: new Date().toISOString()
      };
      registration.usedAt = Date.now();
      registration.robloxUserId = String(robloxUserId);
      return data.users[registration.discordId];
    });
  }

  getUser(discordId) {
    return this.read(data => data.users[discordId] || null);
  }

  async createTicket(ticket) {
    return this.update(data => {
      data.tickets[ticket.id] = ticket;
      return ticket;
    });
  }

  async updateTicket(id, patch) {
    return this.update(data => {
      if (!data.tickets[id]) throw new Error('Ticket não encontrado.');
      data.tickets[id] = { ...data.tickets[id], ...patch };
      return data.tickets[id];
    });
  }

  getTicket(id) {
    return this.read(data => data.tickets[id] || null);
  }

  listOpenTickets({ kind, guildId, category } = {}) {
    return this.read(data => Object.values(data.tickets).filter(ticket =>
      ticket.status === 'open' &&
      (!kind || ticket.kind === kind) &&
      (!guildId || ticket.guildId === guildId) &&
      (!category || ticket.category === category)
    ));
  }

  async nextCounter(key) {
    return this.update(data => {
      data.counters[key] = (data.counters[key] || 0) + 1;
      return data.counters[key];
    });
  }

  async saveTranscript(id, record) {
    return this.update(data => {
      data.transcripts[id] = record;
      return record;
    });
  }

  getTranscript(id) {
    return this.read(data => data.transcripts[id] || null);
  }
}
