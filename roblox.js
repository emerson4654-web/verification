const API = {
  usernames: 'https://users.roblox.com/v1/usernames/users',
  user: id => `https://users.roblox.com/v1/users/${id}`,
  groups: id => `https://groups.roblox.com/v2/users/${id}/groups/roles`
};

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    signal: AbortSignal.timeout(15000)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.errors?.[0]?.message || `Roblox respondeu HTTP ${response.status}.`;
    throw new Error(message);
  }
  return body;
}

export async function resolveUsername(username) {
  const clean = String(username || '').trim();
  if (!clean || clean.length < 3 || clean.length > 20 || !/^[A-Za-z0-9_]+$/.test(clean)) {
    throw new Error('Digite um nome de usuário Roblox válido (3 a 20 caracteres, letras, números e _).');
  }
  const result = await requestJson(API.usernames, {
    method: 'POST',
    body: JSON.stringify({ usernames: [clean], excludeBannedUsers: false })
  });
  const user = result.data?.[0];
  if (!user?.id) throw new Error('Não encontrei esse nome de usuário no Roblox. Confira a escrita.');
  return { id: String(user.id), username: user.name, displayName: user.displayName };
}

export async function getRobloxProfile(userId) {
  return requestJson(API.user(userId));
}

export async function getUserGroupRole(userId, groupId) {
  const result = await requestJson(API.groups(userId));
  const entry = (result.data || []).find(item => String(item.group?.id) === String(groupId));
  if (!entry) return null;
  return {
    groupId: String(entry.group.id),
    groupName: entry.group.name,
    roleId: String(entry.role.id),
    roleName: entry.role.name,
    rank: Number(entry.role.rank)
  };
}

export async function verifyBioCode(username, expectedCode) {
  const user = await resolveUsername(username);
  const profile = await getRobloxProfile(user.id);
  const description = String(profile.description || '');
  if (!description.toLowerCase().includes(String(expectedCode).toLowerCase())) {
    throw new Error('Não encontrei o código na biografia do Roblox. Coloque o código exatamente como aparece no site e tente novamente.');
  }
  return {
    id: user.id,
    username: profile.name || user.username,
    displayName: profile.displayName || user.displayName
  };
}
