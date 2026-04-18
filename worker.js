const R2_PUBLIC_BASE_URL = 'https://pub-2c5587529e4249efbcf882d5d3697d95.r2.dev';

function joinTargetUrl(pathname, search, env) {
  const base = String(env.R2_PUBLIC_BASE_URL || R2_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  const suffix = pathname.replace(/^\/cloud-assets/, '');
  return `${base}${suffix}${search || ''}`;
}

function makeProxyHeaders(request) {
  const headers = new Headers();
  for (const name of ['range', 'if-none-match', 'if-modified-since', 'accept']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

async function proxyCloudAsset(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/cloud-assets/')) {
    return new Response('Missing cloud asset path.', { status: 400 });
  }

  const isRangeRequest = request.headers.has('range');
  const fetchOptions = {
    method: request.method,
    headers: makeProxyHeaders(request),
    redirect: 'follow',
  };

  if (!isRangeRequest) {
    fetchOptions.cf = {
      cacheEverything: true,
      cacheTtlByStatus: {
        '200-299': 31536000,
        '404': 60,
        '500-599': 0,
      },
    };
  }

  const upstream = await fetch(joinTargetUrl(url.pathname, url.search, env), fetchOptions);

  const headers = new Headers(upstream.headers);
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  headers.set('Accept-Ranges', headers.get('Accept-Ranges') || 'bytes');
  if (!isRangeRequest && upstream.status >= 200 && upstream.status < 300) {
    headers.set('Cache-Control', headers.get('Cache-Control') || 'public, max-age=31536000, immutable');
    headers.set('CDN-Cache-Control', 'public, max-age=31536000, immutable');
  }
  headers.delete('Access-Control-Allow-Origin');
  headers.delete('Access-Control-Expose-Headers');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/cloud-assets/')) {
      return proxyCloudAsset(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
