const app = require('../backend/server');

module.exports = (req, res) => {
  let subpath = req.query?.__path;
  if (!subpath && req.url && req.url.includes('__path=')) {
    try {
      const u = new URL(req.url, 'http://localhost');
      subpath = u.searchParams.get('__path');
    } catch(e) {}
  }

  if (subpath) {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      urlObj.searchParams.delete('__path');
      const qs = urlObj.searchParams.toString();
      const cleanSubpath = subpath.startsWith('/') ? subpath.slice(1) : subpath;
      req.url = '/api/' + cleanSubpath + (qs ? '?' + qs : '');
    } catch (e) {
      req.url = '/api/' + (subpath.startsWith('/') ? subpath.slice(1) : subpath);
    }
  } else if (req.url && !req.url.startsWith('/api/') && req.url !== '/api') {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
