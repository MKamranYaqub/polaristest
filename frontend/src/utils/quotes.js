// Lightweight helper to call backend /api/quotes endpoints
export async function saveQuote(quoteData) {
  const res = await fetch('/api/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quoteData),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to save quote: ${res.status} ${text}`);
  }
  return res.json();
}

export async function listQuotes({ user_id = null, calculator_type = null, limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (user_id) params.append('user_id', user_id);
  if (calculator_type) params.append('calculator_type', calculator_type);
  params.append('limit', String(limit));
  params.append('offset', String(offset));
  const res = await fetch(`/api/quotes?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to list quotes: ${res.statusText}`);
  return res.json();
}

export async function getQuote(id) {
  const res = await fetch(`/api/quotes/${id}`);
  if (!res.ok) throw new Error(`Failed to get quote ${id}: ${res.statusText}`);
  return res.json();
}

export async function updateQuote(id, updates) {
  const res = await fetch(`/api/quotes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update quote ${id}: ${res.statusText}`);
  return res.json();
}

export async function deleteQuote(id) {
  const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete quote ${id}: ${res.statusText}`);
  return res.json();
}
