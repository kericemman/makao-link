const sendWithRetry = async (send, message, { maxAttempts = 3, baseDelayMs = 250, maxDelayMs = 2000, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) => {
  if (typeof send !== "function") throw new TypeError("A send function is required");
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 5) throw new TypeError("maxAttempts must be between 1 and 5");
  if (!Number.isFinite(baseDelayMs) || baseDelayMs < 0 || !Number.isFinite(maxDelayMs) || maxDelayMs < baseDelayMs) {
    throw new TypeError("Invalid retry delay bounds");
  }

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await send(message);
      if (!result || result.status !== "sent") throw Object.assign(new Error(result?.failureCode || "Transport send failed"), { retryable: result?.status !== "failed" });
      return { ...result, attempts: attempt };
    } catch (error) {
      lastError = error;
      if (error?.retryable === false || attempt === maxAttempts) break;
      await sleep(Math.min(baseDelayMs * (2 ** (attempt - 1)), maxDelayMs));
    }
  }
  throw lastError;
};

module.exports = { sendWithRetry };
