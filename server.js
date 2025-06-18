const axios = require('axios');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createApiHelper(config = {}) {
  const {
    timeout,
    errorFormatter,
    retry = 0,
    retryDelay = 300,
    getAuthToken,
    refreshAuthToken,
    authHeader = 'Authorization',
    ...axiosConfig
  } = config;

  let staticAuthToken = null;
  let customAuthHeaders = {};

  const instance = axios.create({
    ...axiosConfig,
    ...(timeout ? { timeout } : {}) 
  });

  function setAuthToken(token) {
    staticAuthToken = token;
  }

  function setAuthHeaders(headers) {
    customAuthHeaders = { ...headers };
  }

  instance.interceptors.request.use(
    async reqConfig => {
      if (staticAuthToken) {
        reqConfig.headers[authHeader] = `Bearer ${staticAuthToken}`;
      }
      if (typeof getAuthToken === 'function') {
        const token = await getAuthToken();
        if (token) reqConfig.headers[authHeader] = `Bearer ${token}`;
      }
      if (customAuthHeaders && typeof customAuthHeaders === 'object') {
        Object.entries(customAuthHeaders).forEach(([key, value]) => {
          reqConfig.headers[key] = value;
        });
      }
      return reqConfig;
    },
    error => Promise.reject(error)
  );

  function getCancelTokenSource() {
    const CancelToken = axios.CancelToken;
    return CancelToken.source();
  }

  async function request(method, url, data, customConfig = {}) {
    const {
      cancelToken,
      timeout: reqTimeout,
      retry: reqRetry = retry,
      retryDelay: reqRetryDelay = retryDelay,
      ...restConfig
    } = customConfig;

    let attempt = 0;
    let lastError;
    let triedRefresh = false;

    while (attempt <= reqRetry) {
      try {
        const res = await instance({
          method,
          url,
          data,
          cancelToken,
          ...(reqTimeout ? { timeout: reqTimeout } : {}),
          ...restConfig
        });
        return { data: res.data, error: null };
      } catch (err) {
        lastError = err;
        const status = err.response?.status;

        // Token refresh logic on 401
        if (
          status === 401 &&
          typeof refreshAuthToken === 'function' &&
          !triedRefresh
        ) {
          triedRefresh = true;
          try {
            await refreshAuthToken();
            continue;
          } catch (refreshErr) {
            lastError = refreshErr;
            break;
          }
        }

        const shouldRetry =
          (!err.response || (status >= 500 && status < 600)) &&
          attempt < reqRetry;

        if (!shouldRetry) break;

        const delay = reqRetryDelay * Math.pow(2, attempt);
        await sleep(delay);
        attempt++;
      }
    }

    let formattedError;
    if (typeof errorFormatter === 'function') {
      formattedError = errorFormatter(lastError);
    } else {
      formattedError = lastError.response
        ? lastError.response.data
        : lastError.message || 'Unknown error';
    }
    return {
      data: null,
      error: formattedError
    };
  }

  return {
    get: (url, config) => request('get', url, undefined, config),
    post: (url, data, config) => request('post', url, data, config),
    put: (url, data, config) => request('put', url, data, config),
    patch: (url, data, config) => request('patch', url, data, config),
    del: (url, config) => request('delete', url, undefined, config),
    head: (url, config) => request('head', url, undefined, config),
    options: (url, config) => request('options', url, undefined, config),
    request: (method, url, data, config) => request(method, url, data, config),
    getCancelTokenSource,
    setAuthToken,
    setAuthHeaders
  };
}

module.exports = createApiHelper