export type SessionUser = {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
};

type ApiResponse<T> = {
  error?: string;
  code?: string;
} & T;

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text();

  if (!text) {
    return {} as ApiResponse<T>;
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new Error('The server returned an invalid response. Please try again.');
  }
}

async function request<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = await parseResponse<T>(response);

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }

  return payload;
}

export async function fetchCurrentSession() {
  const payload = await request<{ user: SessionUser | null }>('/api/auth/session', {
    method: 'GET',
    cache: 'no-store',
  });

  return payload.user ?? null;
}

export async function signUpWithEmail(input: {
  name: string;
  email: string;
  password: string;
}) {
  return request<{
    message: string;
    previewUrl?: string | null;
    verificationUrl?: string | null;
  }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function signInWithEmail(input: { email: string; password: string }) {
  return request<{ message: string; user: SessionUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function signOutFromSession() {
  return request<{ message: string }>('/api/auth/logout', {
    method: 'POST',
  });
}

export async function verifyEmailAddress(token: string) {
  return request<{ message: string; user: SessionUser }>(
    `/api/auth/verify?token=${encodeURIComponent(token)}`,
    {
      method: 'GET',
      cache: 'no-store',
    },
  );
}
