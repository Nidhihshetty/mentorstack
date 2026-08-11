import dotenv from 'dotenv';
import amqp from 'amqplib';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load chatbot-agent env first.
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Import only GEMINI_API_KEY from backend env so we share the same key
// without accidentally overriding chatbot-specific vars like PORT.
const backendEnv = dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
if (backendEnv?.parsed?.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = backendEnv.parsed.GEMINI_API_KEY;
}

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const PORT = Number(process.env.CHATBOT_AGENT_PORT || process.env.AGENT_PORT || 10000);
const DIRECT_EXCHANGE = process.env.DIRECT_EXCHANGE || 'direct-exchange';
const USER_QUESTIONS_QUEUE = process.env.USER_QUESTIONS_QUEUE || 'user-questions-queue';
const AI_QUESTION_ROUTING_KEY = process.env.AI_QUESTION_ROUTING_KEY || 'ai-question';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is missing for chatbot-agent');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const AGENT_TOKEN = process.env.AGENT_TOKEN || '';
const MAX_WAIT_FOR_RETRY_MS = Number(process.env.GEMINI_MAX_WAIT_MS || 300000);
const MAX_RETRY_ATTEMPTS = Number(process.env.GEMINI_MAX_RETRY_ATTEMPTS || 8);
const ENABLE_AI_LOGGING = process.env.ENABLE_AI_LOGGING !== 'false';
const AI_LOG_TIMEOUT_MS = Math.max(1000, Number(process.env.AI_LOG_TIMEOUT_MS || 15000));
const AI_LOG_RETRIES = Math.max(0, Number(process.env.AI_LOG_RETRIES || 2));
const STRICT_GEMINI_MODELS = Boolean(process.env.GEMINI_MODELS);
const GEMINI_MODELS = process.env.GEMINI_MODELS
  ? process.env.GEMINI_MODELS.split(',').map((m) => m.trim()).filter(Boolean)
  : ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

let resolvedModelsPromise = null;
let resolvedModelNames = [];
const modelCooldownUntil = new Map();

function normalizeModelName(name) {
  return String(name || '').replace(/^models\//, '').trim();
}

function isModelNotFoundError(err) {
  const status = err?.status || err?.response?.status;
  const message = String(err?.message || '');
  return status === 404 || message.includes('[404 Not Found]') || message.includes('is not found for API version');
}

function getErrorStatus(err) {
  return Number(err?.status || err?.response?.status || 0);
}

function parseRetryDelaySeconds(err) {
  const details = Array.isArray(err?.errorDetails) ? err.errorDetails : [];
  const retryInfo = details.find((d) => String(d?.['@type'] || '').includes('RetryInfo'));
  const retryDelayRaw = String(retryInfo?.retryDelay || '');
  const retryDelayMatch = retryDelayRaw.match(/([0-9]+(?:\.[0-9]+)?)s/i);
  if (retryDelayMatch) {
    return Math.max(1, Math.ceil(Number(retryDelayMatch[1])));
  }

  const msg = String(err?.message || '');
  const fromMsg = msg.match(/retry in\s+([0-9]+(?:\.[0-9]+)?)s/i);
  if (fromMsg) {
    return Math.max(1, Math.ceil(Number(fromMsg[1])));
  }

  return 0;
}

function extractQuotaViolations(err) {
  const details = Array.isArray(err?.errorDetails) ? err.errorDetails : [];
  const quotaFailure = details.find((d) => String(d?.['@type'] || '').includes('QuotaFailure'));
  const violations = Array.isArray(quotaFailure?.violations) ? quotaFailure.violations : [];
  return violations;
}

function getQuotaCooldownSeconds(err) {
  const violations = extractQuotaViolations(err);
  if (!violations.length) return 0;

  const hasNoFreeTierModel = violations.some((v) => String(v?.quotaValue || '') === '0');
  const hasDailyLimitHit = violations.some((v) => String(v?.quotaId || '').includes('PerDay'));

  // If free-tier for the model is effectively unavailable or exhausted for the day,
  // pause it for a long window to avoid repeatedly hammering dead paths.
  if (hasNoFreeTierModel) return 12 * 60 * 60;
  if (hasDailyLimitHit) return 6 * 60 * 60;
  return 0;
}

function isRetryableGeminiError(err) {
  const status = getErrorStatus(err);
  if (status === 429 || status === 503) return true;
  const msg = String(err?.message || '').toLowerCase();
  return msg.includes('quota exceeded') || msg.includes('high demand') || msg.includes('try again later');
}

function getModelCooldownRemainingSec(modelName) {
  const until = modelCooldownUntil.get(modelName);
  if (!until) return 0;
  const now = Date.now();
  if (until <= now) {
    modelCooldownUntil.delete(modelName);
    return 0;
  }
  return Math.ceil((until - now) / 1000);
}

function setModelCooldown(modelName, seconds) {
  const sec = Math.max(1, Number(seconds) || 1);
  const until = Date.now() + sec * 1000;
  const existing = modelCooldownUntil.get(modelName) || 0;
  modelCooldownUntil.set(modelName, Math.max(existing, until));
}

function getSoonestCooldownSec(modelNames) {
  let best = Infinity;
  for (const modelName of modelNames) {
    const left = getModelCooldownRemainingSec(modelName);
    if (left > 0) {
      best = Math.min(best, left);
    }
  }
  return Number.isFinite(best) ? best : 0;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAvailableGeminiModels() {
  try {
    const response = await axios.get('https://generativelanguage.googleapis.com/v1beta/models', {
      params: { key: GEMINI_API_KEY },
      timeout: 10000,
    });

    const models = Array.isArray(response?.data?.models) ? response.data.models : [];
    const available = models
      .filter((model) => {
        const methods = Array.isArray(model?.supportedGenerationMethods)
          ? model.supportedGenerationMethods
          : [];
        return model?.name && methods.includes('generateContent') && String(model.name).includes('gemini');
      })
      .map((model) => normalizeModelName(model.name))
      .filter(Boolean);

    return [...new Set(available)];
  } catch (err) {
    console.error('Failed to list Gemini models, using configured fallback list.', err?.message || err);
    return [];
  }
}

function prioritizeModels(availableModels) {
  if (!availableModels.length) {
    return GEMINI_MODELS;
  }

  const byConfiguredPriority = GEMINI_MODELS.filter((model) => availableModels.includes(model));

  if (STRICT_GEMINI_MODELS) {
    if (byConfiguredPriority.length) {
      return byConfiguredPriority;
    }
    console.warn('Configured GEMINI_MODELS are not available for this key; using configured list as-is.');
    return GEMINI_MODELS;
  }

  const remaining = availableModels.filter((model) => !byConfiguredPriority.includes(model));
  const remainingPreferred = remaining.filter((name) => /flash|pro/i.test(name));
  const merged = [...byConfiguredPriority, ...remainingPreferred, ...remaining];

  if (merged.length) {
    return [...new Set(merged)].slice(0, 10);
  }

  const byHeuristic = availableModels
    .filter((name) => /flash|pro/i.test(name))
    .slice(0, 6);

  return byHeuristic.length ? byHeuristic : availableModels.slice(0, 6);
}

async function getResolvedModels() {
  if (!resolvedModelsPromise) {
    resolvedModelsPromise = (async () => {
      const available = await fetchAvailableGeminiModels();
      const chosen = prioritizeModels(available);
      resolvedModelNames = chosen;
      console.log(`Gemini model order: ${chosen.join(', ')}`);
      return chosen;
    })();
  }

  return resolvedModelsPromise;
}

async function tryGenerateWithModels(question, modelNames) {
  let lastError = null;
  let hadModelNotFound = false;
  let attemptedAny = false;

  for (const modelName of modelNames) {
    const cooldownLeft = getModelCooldownRemainingSec(modelName);
    if (cooldownLeft > 0) {
      console.warn(`Skipping model ${modelName}; cooldown active for ${cooldownLeft}s`);
      continue;
    }

    attemptedAny = true;
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(question);
      const response = await result.response;
      const answer = response.text();
      if (answer && answer.trim()) {
        modelCooldownUntil.delete(modelName);
        console.log(`Gemini response succeeded with model: ${modelName}`);
        return { answer: answer.trim(), lastError: null, hadModelNotFound, cooldownSeconds: 0 };
      }
    } catch (err) {
      lastError = err;
      if (isModelNotFoundError(err)) {
        hadModelNotFound = true;
        // Avoid repeated 404 spam for invalid model IDs.
        setModelCooldown(modelName, 3600);
      } else if (isRetryableGeminiError(err)) {
        const quotaCooldownSec = getQuotaCooldownSeconds(err);
        const retrySec = quotaCooldownSec || parseRetryDelaySeconds(err) || 15;
        setModelCooldown(modelName, retrySec);
      }
      const status = getErrorStatus(err);
      const retrySec = parseRetryDelaySeconds(err);
      const quotaCooldownSec = getQuotaCooldownSeconds(err);
      console.error(
        `Gemini model failed (${modelName}) status=${status || 'unknown'} retry=${retrySec || 0}s cooldown=${quotaCooldownSec || retrySec || 0}s`,
        err?.message || err
      );
    }
  }

  const cooldownSeconds = attemptedAny ? 0 : getSoonestCooldownSec(modelNames);
  return { answer: null, lastError, hadModelNotFound, cooldownSeconds };
}

async function generateAnswerWithRetry(question) {
  const startedAt = Date.now();
  let attempts = 0;
  let lastError = null;

  while (attempts < MAX_RETRY_ATTEMPTS) {
    attempts += 1;
    try {
      return await generateAnswer(question);
    } catch (err) {
      lastError = err;
      const status = getErrorStatus(err);
      const retrySec = Number(err?.retryAfterSec || parseRetryDelaySeconds(err) || 0);
      if (!isRetryableGeminiError(err) && err?.code !== 'GEMINI_COOLDOWN') {
        throw err;
      }

      const waitMs = Math.max(1000, (retrySec || 5) * 1000);
      if (Date.now() + waitMs - startedAt > MAX_WAIT_FOR_RETRY_MS) {
        throw err;
      }

      console.warn(`Gemini unavailable (status=${status || 'unknown'}). Retrying in ${Math.ceil(waitMs / 1000)}s...`);
      await sleep(waitMs);
    }
  }

  throw lastError || new Error('No Gemini model produced a response');
}

async function generateAnswer(question) {
  const initialModels = await getResolvedModels();
  const firstAttempt = await tryGenerateWithModels(question, initialModels);
  if (firstAttempt.answer) {
    return firstAttempt.answer;
  }

  if (firstAttempt.cooldownSeconds > 0) {
    const err = new Error(`All Gemini models are cooling down. Retry in ${firstAttempt.cooldownSeconds}s.`);
    err.code = 'GEMINI_COOLDOWN';
    err.retryAfterSec = firstAttempt.cooldownSeconds;
    throw err;
  }

  if (firstAttempt.hadModelNotFound) {
    // Model availability can differ by key and change over time; refresh and retry once.
    resolvedModelsPromise = null;
    const refreshedModels = await getResolvedModels();
    const secondAttempt = await tryGenerateWithModels(question, refreshedModels);
    if (secondAttempt.answer) {
      return secondAttempt.answer;
    }
    if (secondAttempt.cooldownSeconds > 0) {
      const err = new Error(`All Gemini models are cooling down. Retry in ${secondAttempt.cooldownSeconds}s.`);
      err.code = 'GEMINI_COOLDOWN';
      err.retryAfterSec = secondAttempt.cooldownSeconds;
      throw err;
    }
    throw secondAttempt.lastError || firstAttempt.lastError || new Error('No Gemini model produced a response');
  }

  throw firstAttempt.lastError || new Error('No Gemini model produced a response');
}

function publishAiReply(ch, userId, answer) {
  const routingKey = `bot-reply.${userId}`;
  const message = { type: 'ai.reply', userId, answer, timestamp: new Date().toISOString() };
  ch.publish(DIRECT_EXCHANGE, routingKey, Buffer.from(JSON.stringify(message)), {
    contentType: 'application/json', persistent: false,
  });
}

async function ensureTopology(ch) {
  await ch.assertExchange(DIRECT_EXCHANGE, 'direct', { durable: true });
  await ch.assertQueue(USER_QUESTIONS_QUEUE, { durable: true });
  await ch.bindQueue(USER_QUESTIONS_QUEUE, DIRECT_EXCHANGE, AI_QUESTION_ROUTING_KEY);
}

async function logAiInteraction(userId, prompt, response) {
  if (!ENABLE_AI_LOGGING) {
    return;
  }

  let lastError = null;

  for (let attempt = 0; attempt <= AI_LOG_RETRIES; attempt += 1) {
    try {
      await axios.post(
        `${BACKEND_URL}/api/ai/log`,
        { userId, prompt, response },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Agent-Token': AGENT_TOKEN,
          },
          timeout: AI_LOG_TIMEOUT_MS,
        }
      );
      return;
    } catch (err) {
      lastError = err;
      if (attempt < AI_LOG_RETRIES) {
        await sleep(1000 * (attempt + 1));
      }
    }
  }

  const status = Number(lastError?.response?.status || 0);
  const detail = lastError?.response?.data || lastError?.message || lastError;
  console.warn(`AI log skipped after retries${status ? ` (status ${status})` : ''}:`, detail);
}

async function handleQuestion(ch, msg) {
  let userId = null;
  try {
    const payload = JSON.parse(msg.content.toString());
    userId = Number(payload?.userId);
    const question = payload?.question;
    if (!userId || !question) throw new Error('Invalid payload');

    const answer = await generateAnswerWithRetry(question);

    // Publish reply first so users are never delayed by DB/API logging issues.
    publishAiReply(ch, userId, answer);

    // Log asynchronously with retry/backoff; never block response path.
    void logAiInteraction(userId, question, answer);

    ch.ack(msg);
  } catch (e) {
    const status = getErrorStatus(e);
    const retrySec = Number(e?.retryAfterSec || parseRetryDelaySeconds(e) || getSoonestCooldownSec(resolvedModelNames) || 0);
    if (isRetryableGeminiError(e) || e?.code === 'GEMINI_COOLDOWN') {
      console.warn(`Failed to process message due to Gemini capacity (status=${status || 'unknown'} retry=${retrySec || 0}s)`);
    } else {
      console.error('Failed to process message', e);
    }
    // Always respond so frontend is never stuck waiting forever.
    if (userId) {
      let fallback = "Sorry, I'm having trouble generating a response right now. Please try again in a moment.";
      if (retrySec >= 3600) {
        fallback = 'AI service is currently rate-limited. Please try again later.';
      } else if (retrySec > 0) {
        fallback = `AI service is currently busy. Please retry in about ${retrySec}s.`;
      }
      try {
        publishAiReply(ch, userId, fallback);
      } catch (publishErr) {
        console.error('Failed to publish fallback AI reply', publishErr);
      }
    }
    ch.ack(msg);
  }
}

async function start() {
  const conn = await amqp.connect(RABBITMQ_URL);
  const ch = await conn.createChannel();
  await ensureTopology(ch);
  console.log('🤖 Chatbot agent connected to RabbitMQ, consuming...');
  await ch.consume(USER_QUESTIONS_QUEUE, (msg) => msg && handleQuestion(ch, msg));

  // Health check HTTP server for Render free tier
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'chatbot-agent', uptime: process.uptime() }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(PORT, () => {
    console.log(`🏥 Health check server running on port ${PORT}`);
  });
}

start().catch((e) => {
  console.error('Agent fatal error', e);
  process.exit(1);
});
