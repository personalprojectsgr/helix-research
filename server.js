require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const { Log } = require('./lib/logger');
const { ensureSessionId } = require('./lib/id');
const catalog = require('./lib/catalog');
const orders = require('./lib/orders');
const plisio = require('./lib/plisio');
const buildPagesRouter = require('./routes/pages');
const buildApiRouter = require('./routes/api');
const buildPaymentRouter = require('./routes/payment');
const buildOrderRouter = require('./routes/order');

const app = express();
const PORT = parseInt(process.env.PORT || '6767', 10);
const STORE_NAME = process.env.STORE_NAME || 'Helix Research';
const STORE_CURRENCY = process.env.STORE_CURRENCY || 'USD';
const TRACKING_ENABLED = process.env.TRACKING_ENABLED === 'true' && !!process.env.FB_PIXEL_ID;
const PLISIO_ENABLED = plisio.isConfigured();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', true);

app.use(cookieParser());

app.post(
  '/api/plisio/webhook',
  express.raw({ type: '*/*', limit: '256kb' }),
  buildPaymentRouter.webhookHandler
);

app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: true, limit: '64kb' }));

app.use((req, res, next) => {
  const sid = ensureSessionId(req, res);
  req.sessionRef = sid.slice(0, 8);
  res.locals.store = {
    name: STORE_NAME,
    currency: STORE_CURRENCY,
    fbPixelId: process.env.FB_PIXEL_ID || '',
    trackingEnabled: TRACKING_ENABLED,
  };
  res.locals.catalog = catalog;
  res.locals.currentPath = req.path;
  res.locals.plisioEnabled = PLISIO_ENABLED;
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    if (status >= 400 || process.env.LOG_HTTP === 'true') {
      Log.http(req.method, req.originalUrl, status, ms, req.sessionRef);
    }
  });
  next();
});

app.use('/static', express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
}));

app.use('/api', buildApiRouter({ catalog, trackingEnabled: TRACKING_ENABLED, storeCurrency: STORE_CURRENCY }));
app.use('/api', buildPaymentRouter({ catalog }));
app.use('/', buildOrderRouter());
app.use('/', buildPagesRouter({ catalog }));

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page not found',
    code: 404,
    message: "We couldn't find what you were looking for.",
    pageContext: 'error',
  });
});

app.use((err, req, res, _next) => {
  Log.error('server_error', req.sessionRef, `${err.message} :: ${err.stack?.split('\n')[1]?.trim() || ''}`);
  res.status(500).render('error', {
    title: 'Something went wrong',
    code: 500,
    message: 'An unexpected error occurred. Please try again.',
    pageContext: 'error',
  });
});

process.on('unhandledRejection', (err) => {
  Log.error('unhandled_rejection', null, `${err && err.message ? err.message : String(err)}`);
});
process.on('uncaughtException', (err) => {
  Log.error('uncaught_exception', null, `${err.message} :: ${err.stack?.split('\n')[1]?.trim() || ''}`);
});

(async () => {
  await orders.init();
  app.listen(PORT, () => {
    Log.startup(PORT, STORE_NAME, TRACKING_ENABLED, catalog.products.length, catalog.categories.length);
    if (PLISIO_ENABLED) {
      Log.ok('Plisio crypto checkout ENABLED', 'plisio');
    } else {
      Log.warn('Plisio not configured - set PLISIO_API_KEY in .env to enable crypto checkout', 'plisio');
    }
    if (!process.env.PLISIO_PUBLIC_BASE_URL) {
      Log.warn("PLISIO_PUBLIC_BASE_URL not set - webhooks won't deliver to localhost. Polling fallback will be used.", 'plisio');
    }
  });
})();
