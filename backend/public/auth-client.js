// backend/public/auth-client.js — JWT auth helper & fetch wrapper

(function() {
  const ACCESS_TOKEN_KEY = 'nestmate_access_token';

  window.getAccessToken = function() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  };

  window.setAccessToken = function(token) {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  };

  window.clearAccessToken = function() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  };

  let isRefreshing = false;
  let refreshSubscribers = [];

  function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
  }

  function onRefreshed(token) {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
  }

  async function refreshTokenCall() {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      if (data.accessToken) {
        window.setAccessToken(data.accessToken);
        return data.accessToken;
      }
      throw new Error('No access token returned');
    } catch (err) {
      window.clearAccessToken();
      return null;
    }
  }

  /**
   * Universal authFetch wrapper. Automatically attaches Bearer token,
   * sets credentials: 'include', and retries once on 401 via /api/auth/refresh.
   */
  window.authFetch = async function(url, options = {}) {
    options.headers = options.headers || {};
    options.credentials = 'include';

    let token = window.getAccessToken();
    if (token) {
      if (options.headers instanceof Headers) {
        options.headers.set('Authorization', `Bearer ${token}`);
      } else {
        options.headers['Authorization'] = `Bearer ${token}`;
      }
    }

    let response = await fetch(url, options);

    // Bypass auto-refresh for public auth endpoints
    const isAuthRequest = url.includes('/api/auth/login') ||
                          url.includes('/api/auth/register') ||
                          url.includes('/api/auth/verify-otp') ||
                          url.includes('/api/auth/send-otp') ||
                          url.includes('/api/auth/refresh');

    if (response.status === 401 && !isAuthRequest) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshTokenCall();
        isRefreshing = false;
        onRefreshed(newToken);
      } else {
        await new Promise(resolve => subscribeTokenRefresh(resolve));
      }

      const retryToken = window.getAccessToken();
      if (retryToken) {
        if (options.headers instanceof Headers) {
          options.headers.set('Authorization', `Bearer ${retryToken}`);
        } else {
          options.headers['Authorization'] = `Bearer ${retryToken}`;
        }
        response = await fetch(url, options);
      }
    }

    return response;
  };
})();
