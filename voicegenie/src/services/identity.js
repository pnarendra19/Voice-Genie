// Anonymous ids stored in the browser. Replace userId with a real login id later.
const USER_KEY = "vg_userId";
const CONV_KEY = "vg_conversationId";
const cache = {};

const makeId = () => crypto.randomUUID();

function getOrCreate(key) {
  if (cache[key]) return cache[key];
  let value;
  try {
    value = localStorage.getItem(key);
    if (!value) {
      value = makeId();
      localStorage.setItem(key, value);
    }
  } catch {
    value = makeId();
  }
  cache[key] = value;
  return value;
}

export const getUserId = () => getOrCreate(USER_KEY);
export const getConversationId = () => getOrCreate(CONV_KEY);

// "New chat": a fresh conversation id means the AI starts with no past context
export function startNewConversation() {
  const value = makeId();
  cache[CONV_KEY] = value;
  try {
    localStorage.setItem(CONV_KEY, value);
  } catch {
    /* ignore */
  }
  return value;
}