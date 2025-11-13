// Lightweight helper to call backend /api/quotes endpoints
import { API_BASE_URL } from '../config/api.js';

export const authHeaders = (tokenOverride) => {
  const token = tokenOverride ?? localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function saveQuote(quoteData) {
  const res = await fetch(`${API_BASE_URL}/api/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
  const res = await fetch(`${API_BASE_URL}/api/quotes?${params.toString()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to list quotes: ${res.statusText}`);
  return res.json();
}

export async function getQuote(id, includeResults = true) {
  const url = includeResults ? `${API_BASE_URL}/api/quotes/${id}?include_results=true` : `${API_BASE_URL}/api/quotes/${id}`;
  const res = await fetch(url, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to get quote ${id}: ${res.statusText}`);
  return res.json();
}

export async function updateQuote(id, updates) {
  const res = await fetch(`${API_BASE_URL}/api/quotes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update quote ${id}: ${res.statusText}`);
  return res.json();
}

export async function deleteQuote(id) {
  const res = await fetch(`${API_BASE_URL}/api/quotes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete quote ${id}: ${res.statusText}`);
  return res.json();
}

export async function upsertQuoteData({ quoteId, calculatorType, payload, token }) {
  const res = await fetch(`${API_BASE_URL}/api/quotes/${quoteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify({
      calculator_type: calculatorType,
      ...payload,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error || `Failed to update quote ${quoteId}`;
    throw new Error(message);
  }

  return res.json().catch(() => ({}));
}

export async function requestDipPdf(quoteId, token) {
  const res = await fetch(`${API_BASE_URL}/api/dip/pdf/${quoteId}`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error || 'Failed to generate DIP PDF';
    throw new Error(message);
  }

  return res;
}

export async function requestQuotePdf(quoteId, token) {
  const res = await fetch(`${API_BASE_URL}/api/quote/pdf/${quoteId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error || 'Failed to generate quote PDF';
    throw new Error(message);
  }

  return res;
}
