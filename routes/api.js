const express = require('express');
const { Log } = require('../lib/logger');
const { sendMetaEvent, buildUserData, getClientInfo, getTrackingConfig } = require('../lib/tracking');

module.exports = function buildApiRouter({ catalog, trackingEnabled, storeCurrency }) {
  const router = express.Router();

  router.get('/tracking/config', (req, res) => {
    res.json({
      ...getTrackingConfig(),
      currency: storeCurrency,
    });
  });

  router.post('/track', async (req, res) => {
    const { event, eventId: clientEventId, sourceUrl, data, user } = req.body || {};
    if (!event || !clientEventId) {
      return res.status(400).json({ ok: false, error: 'event and eventId required' });
    }
    Log.event('track_received', req.sessionRef, `${event}`, { id: clientEventId.slice(-12) });
    const client = getClientInfo(req);
    const userData = buildUserData({ ...client, ...(user || {}) });
    const result = await sendMetaEvent({
      eventName: event,
      eventId: clientEventId,
      sourceUrl,
      userData,
      customData: data || {},
      sessionRef: req.sessionRef,
    });
    res.json({ ok: result.ok, dedupId: clientEventId, capi: result });
  });

  return router;
};
