import Stripe from "stripe";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import { logger } from "../utils/logger.js";

dotenv.config();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create Stripe Payment Intent
 * @param {number} amount - Amount in cents
 * @param {string} currency - Currency code
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} - Stripe payment intent
 */
export const createStripePayment = async (amount, currency, metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        ...metadata,
        integration: "ai-ecommerce"
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    logger.info(`Stripe payment intent created: ${paymentIntent.id}`);
    return paymentIntent;
  } catch (error) {
    logger.error("Stripe payment intent creation failed:", error);
    throw error;
  }
};

/**
 * Verify Stripe Payment
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<object>} - Payment intent details
 */
export const verifyStripePayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    logger.error("Stripe payment verification failed:", error);
    throw error;
  }
};

/**
 * Create Stripe Customer
 * @param {string} email - Customer email
 * @param {string} name - Customer name
 * @returns {Promise<object>} - Stripe customer
 */
export const createStripeCustomer = async (email, name) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        platform: "ai-ecommerce"
      }
    });

    logger.info(`Stripe customer created: ${customer.id}`);
    return customer;
  } catch (error) {
    logger.error("Stripe customer creation failed:", error);
    throw error;
  }
};

/**
 * Create Razorpay Order
 * @param {number} amount - Amount in paise
 * @param {string} currency - Currency code
 * @param {object} notes - Additional notes
 * @returns {Promise<object>} - Razorpay order
 */
export const createRazorpayOrder = async (amount, currency, notes = {}) => {
  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      notes: {
        ...notes,
        platform: "ai-ecommerce"
      }
    });

    logger.info(`Razorpay order created: ${order.id}`);
    return order;
  } catch (error) {
    logger.error("Razorpay order creation failed:", error);
    throw error;
  }
};

/**
 * Verify Razorpay Payment Signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} - Is signature valid
 */
export const verifyRazorpayPayment = async (orderId, paymentId, signature) => {
  try {
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const isValid = generatedSignature === signature;

    if (isValid) {
      logger.info(`Razorpay payment verified: ${paymentId}`);
    } else {
      logger.warn(`Razorpay payment verification failed: ${paymentId}`);
    }

    return isValid;
  } catch (error) {
    logger.error("Razorpay payment verification failed:", error);
    throw error;
  }
};

/**
 * Create Razorpay Refund
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Refund amount in paise
 * @returns {Promise<object>} - Refund details
 */
export const createRazorpayRefund = async (paymentId, amount) => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount
    });

    logger.info(`Razorpay refund created: ${refund.id}`);
    return refund;
  } catch (error) {
    logger.error("Razorpay refund creation failed:", error);
    throw error;
  }
};

/**
 * Get Stripe Payment Methods for Customer
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<object[]>} - List of payment methods
 */
export const getStripePaymentMethods = async (customerId) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card"
    });

    return paymentMethods.data;
  } catch (error) {
    logger.error("Failed to get Stripe payment methods:", error);
    throw error;
  }
};

/**
 * Process Stripe Webhook
 * @param {string} payload - Raw webhook payload
 * @param {string} signature - Stripe signature header
 * @returns {object} - Parsed event
 */
export const processStripeWebhook = (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    logger.info(`Stripe webhook received: ${event.type}`);
    return event;
  } catch (error) {
    logger.error("Stripe webhook verification failed:", error);
    throw error;
  }
};

/**
 * Get Razorpay Payment Details
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<object>} - Payment details
 */
export const getRazorpayPayment = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    logger.error("Failed to get Razorpay payment:", error);
    throw error;
  }
};

export default {
  createStripePayment,
  verifyStripePayment,
  createStripeCustomer,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createRazorpayRefund,
  getStripePaymentMethods,
  processStripeWebhook,
  getRazorpayPayment
};

