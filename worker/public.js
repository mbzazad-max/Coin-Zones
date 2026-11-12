/* Public, read-only Coin Zones viewer. Separate from the Access-protected dashboard.
   Never bind GITHUB_TOKEN or any other secret to this Worker. */
const DENY = { status: 404, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } };
const allowed = new Set([
  '/', '/index.html', '/data.json', '/pnl.json', '/freshness.json',
  '/shim.js', '/engine.js', '/series.js', '/holdodds.js', '/pnl.js',
  '/refresh.js', '/public-view.js'
]);
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Not found', DENY);
    if (!allowed.has(url.pathname)) return new Response('Not found', DENY);
    const response = await env.ASSETS.fetch(request);
    if (!response.ok) return response;
    const headers = new Headers(response.headers);
    headers.set('x-content-type-options', 'nosniff');
    headers.set('referrer-policy', 'no-referrer');
    headers.set('cache-control', url.pathname.endsWith('.json') ? 'public, max-age=60' : 'public, max-age=300');
    if (url.pathname !== '/' && url.pathname !== '/index.html') {
      return new Response(response.body, { status: response.status, headers });
    }
    const transformed = new HTMLRewriter()
      .on('script[src="cloud.js"]', { element(element) { element.setAttribute('src', 'public-view.js'); } })
      .transform(response);
    return new Response(transformed.body, { status: transformed.status, headers });
  }
};
