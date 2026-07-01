import server from '../dist/server/server.js';

export default async function handler(req, res) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const url = new URL(req.url, `${protocol}://${host}`);

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const bodyBuffer = Buffer.concat(chunks);

  const webRequest = new Request(url.toString(), {
    method: req.method,
    headers: Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.join(', ') : (v ?? ''),
      ]),
    ),
    body:
      bodyBuffer.length > 0 &&
      !['GET', 'HEAD'].includes(req.method?.toUpperCase() ?? '')
        ? bodyBuffer
        : undefined,
  });

  const response = await server.fetch(webRequest);

  res.status(response.status);

  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase() === 'set-cookie') {
      const existing = res.getHeader('set-cookie');
      res.setHeader(
        'set-cookie',
        existing
          ? [...(Array.isArray(existing) ? existing : [existing]), value]
          : value,
      );
    } else {
      res.setHeader(key, value);
    }
  }

  res.end(Buffer.from(await response.arrayBuffer()));
}
