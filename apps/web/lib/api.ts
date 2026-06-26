const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function apiRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message =
      body && typeof body === 'object' && 'error' in body
        ? String(body.error)
        : `Request failed with status ${response.status}`

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export function getApiBaseUrl() {
  return apiBaseUrl
}
