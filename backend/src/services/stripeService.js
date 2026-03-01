'use strict';

const Stripe = require('stripe');

const stripeKey = process.env.STRIPE_SECRET_KEY;
const forceMock = process.env.STRIPE_MOCK === 'true';
const mockKeyMarker = process.env.STRIPE_MOCK_KEY || 'sk_test_mock';
const usingMock = forceMock || !stripeKey || stripeKey.includes('mock') || stripeKey === mockKeyMarker;

const stripeClient = usingMock ? null : Stripe(stripeKey);

const mockSessions = new Map();

const baseFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const createCheckoutSession = async (options) => {
  if (!stripeClient) {
    const id = `mock_cs_${Date.now()}`;
    const session = {
      id,
      url: `${baseFrontendUrl}/?mock_session_id=${id}`,
      metadata: options.metadata || {},
      payment_status: 'paid',
      mode: options.mode || 'payment'
    };
    mockSessions.set(id, session);
    return session;
  }
  return stripeClient.checkout.sessions.create(options);
};

const retrieveSession = async (sessionId, options) => {
  if (!stripeClient) {
    const stored = mockSessions.get(sessionId);
    if (!stored) {
      throw new Error(`Mock Stripe session ${sessionId} not found`);
    }
    return {
      ...stored,
      payment_status: stored.payment_status,
      payment_intent: stored.payment_intent || { status: 'succeeded' }
    };
  }
  return stripeClient.checkout.sessions.retrieve(sessionId, options);
};

const createCustomer = async (payload) => {
  if (!stripeClient) {
    return { id: `mock_cust_${Date.now()}` };
  }
  return stripeClient.customers.create(payload);
};

const constructEvent = (body, signature, secret) => {
  if (!stripeClient) {
    throw new Error('Stripe webhooks are disabled in mock mode');
  }
  return stripeClient.webhooks.constructEvent(body, signature, secret);
};

module.exports = {
  createCheckoutSession,
  retrieveSession,
  createCustomer,
  constructEvent,
  hasStripe: Boolean(stripeClient),
  usingMock
};
