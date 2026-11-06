import { escapeHtml, makeId } from './utils.js';

export async function collectChannelMessages(channel, limit = 1000) {
  const all = [];
  let before;
  while (all.length < limit) {
    const batch = await channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
    if (!batch.size) break;
    const items = [...batch.values()];
    all.push(...items);
    before = items[items.length - 1].id;
    if (batch.size < 100) break;
  }
  return all.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
}

export function createTranscriptRecord(channel, messages, baseUrl, ticket) {
  const id = makeId(10);
  const rows = messages.map(message => ({
    author: message.author?.tag || message.author?.username || 'Usuário desconhecido',
    authorId: message.author?.id || '',
    avatar: message.author?.displayAvatarURL?.({ extension: 'png', size: 64 }) || '',
    content: message.content || '',
    timestamp: new Date(message.createdTimestamp).toISOString(),
    attachments: [...message.attachments.values()].map(file => ({ name: file.name || 'arquivo', url: file.url })),
    embeds: message.embeds.map(embed => ({ title: embed.title || '', description: embed.description || '' }))
  }));
  return {
    id,
    createdAt: new Date().toISOString(),
    guildId: channel.guildId,
    guildName: channel.guild?.name || '',
    channelName: channel.name,
    ticket,
    messages: rows,
    url: `${baseUrl.replace(/\/$/, '')}/transcripts/${id}`
  };
}

export function renderTranscript(record) {
  const messages = record.messages.map(message => {
    const attachments = message.attachments.map(file => `<div class="attachment"><a href="${escapeHtml(file.url)}" target="_blank" rel="noopener">${escapeHtml(file.name)}</a></div>`).join('');
    const embeds = message.embeds.map(embed => `<div class="embed"><strong>${escapeHtml(embed.title)}</strong><p>${escapeHtml(embed.description)}</p></div>`).join('');
    return `<article class="message"><img src="${escapeHtml(message.avatar)}" alt=""><div class="body"><div class="meta"><strong>${escapeHtml(message.author)}</strong><span>${escapeHtml(new Date(message.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))}</span></div><div class="content">${escapeHtml(message.content).replaceAll('\n', '<br>')}</div>${attachments}${embeds}</div></article>`;
  }).join('\n');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Transcript ${escapeHtml(record.channelName)}</title><style>
  *{box-sizing:border-box}body{margin:0;background:#0b1220;color:#e8edf7;font:15px/1.5 system-ui,Arial,sans-serif}.wrap{max-width:980px;margin:32px auto;padding:0 18px}.head{background:#151f33;border:1px solid #2a3853;border-radius:16px;padding:22px;margin-bottom:18px}.head h1{margin:0 0 8px}.muted{color:#9eacc5}.message{display:flex;gap:12px;padding:15px 10px;border-bottom:1px solid #243049}.message img{width:38px;height:38px;border-radius:50%;background:#253047}.body{min-width:0;flex:1}.meta{display:flex;gap:12px;flex-wrap:wrap}.meta span{color:#8796b2;font-size:12px}.content{white-space:normal;overflow-wrap:anywhere;margin-top:4px}.attachment,.embed{margin-top:8px;padding:10px;background:#151f33;border-left:3px solid #6688cc;border-radius:7px}.attachment a{color:#9dc1ff}.embed p{margin:4px 0 0}.empty{padding:30px;text-align:center;color:#9eacc5}
  </style></head><body><main class="wrap"><header class="head"><h1>Transcript do ticket</h1><div>${escapeHtml(record.guildName)} · #${escapeHtml(record.channelName)}</div><div class="muted">Tipo: ${escapeHtml(record.ticket?.kind || '')} · Fechado em: ${escapeHtml(new Date(record.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))}</div><div class="muted">Abertura: ${escapeHtml(record.ticket?.openedAt || '')}</div></header><section>${messages || '<div class="empty">Nenhuma mensagem registrada.</div>'}</section></main></body></html>`;
}
