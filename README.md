# 📦 apiwiz

> A lightweight and flexible Node.js helper to simplify all types of HTTP API calls — no more boilerplate or manual `try-catch`!

---

## 🚀 Features

- ✅ Easy-to-use API for all HTTP methods (GET, POST, PUT, PATCH, DELETE, etc.)
- 🧠 Built-in error handling (no need for `try-catch`)
- ⚙️ Supports custom Axios configuration (`baseURL`, headers, interceptors, etc.)
- 🔁 Automatic retries with exponential backoff on network/5xx errors
- 🔐 Automatic token attachment and refresh on 401 Unauthorized
- 💬 Consistent response format: `{ data, error }`
- ⏱️ Global & per-request timeout support
- ❌ Request cancellation support
- 🧩 Custom error formatting
- 🧪 Easily testable and extendable

---

## 📦 Installation

```bash
npm install apiwiz
````

---

## 🧑‍💻 Usage

```js
const createApiHelper = require('apiwiz');

// Example token handling
let myToken = 'initial-token';

async function getAuthToken() {
  return myToken;
}

async function refreshAuthToken() {
  myToken = 'new-token';
}

const api = createApiHelper({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 2000,
  retry: 2,
  retryDelay: 500,
  errorFormatter: (err) => ({
    status: err.response?.status,
    message: err.message,
    url: err.config?.url
  }),
  getAuthToken,
  refreshAuthToken,
  authHeader: 'Authorization'
});

async function example() {
  api.setAuthToken('static-token');
  api.setAuthHeaders({ 'X-API-KEY': 'my-api-key' });

  const { data, error } = await api.get('/posts/1');
  if (error) {
    console.error('GET error:', error);
  } else {
    console.log('GET data:', data);
  }
}

example();
```

---

## 🔐 Authentication Features

### 1. Automatic Token Attachment

Set a static token:

```js
api.setAuthToken('your-jwt-token');
```

Or provide a function to fetch the token dynamically:

```js
const api = createApiHelper({
  getAuthToken: async () => getCurrentTokenSomehow()
});
```

By default, the token is attached as a `Bearer` token in the `Authorization` header.

---

### 2. Token Refresh on 401 Unauthorized

Provide a `refreshAuthToken` async function. If a request fails with 401, this function is called and the request is retried:

```js
const api = createApiHelper({
  getAuthToken: async () => myToken,
  refreshAuthToken: async () => {
    myToken = await getNewToken();
  }
});
```

---

### 3. Custom Authentication Headers

Change the header used for authentication:

```js
const api = createApiHelper({
  authHeader: 'X-API-KEY'
});
api.setAuthToken('my-api-key');
```

Or set multiple custom headers:

```js
api.setAuthHeaders({
  'X-API-KEY': 'my-api-key',
  'Another-Header': 'value'
});
```

---

## 📚 API

All methods return a Promise resolving to:

```ts
{ data: T | null, error: ErrorObject | null }
```

### Core HTTP Methods

| Method                                     | Description     |
| ------------------------------------------ | --------------- |
| `api.get(url, config)`                     | GET request     |
| `api.post(url, data, config)`              | POST request    |
| `api.put(url, data, config)`               | PUT request     |
| `api.patch(url, data, config)`             | PATCH request   |
| `api.del(url, config)`                     | DELETE request  |
| `api.head(url, config)`                    | HEAD request    |
| `api.options(url, config)`                 | OPTIONS request |
| `api.request(method, url, data?, config?)` | Any HTTP method |

### Utility Methods

* `api.setAuthToken(token)` — Set a static token
* `api.setAuthHeaders(headers)` — Set custom auth headers
* `api.getCancelTokenSource()` — Create a cancel token source for request cancellation

---

## ⚙️ Advanced Features

### Timeout Support

```js
// Global timeout
createApiHelper({ timeout: 1000 });

// Per-request timeout
api.get('/posts/1', { timeout: 200 });
```

---

### Request Cancellation

```js
const source = api.getCancelTokenSource();
const promise = api.get('/posts/1', { cancelToken: source.token });

source.cancel('Request aborted by user');

const result = await promise;
console.log(result);
```

---

### Retry with Exponential Backoff

Retry failed requests (network or 5xx errors):

```js
// Global config
createApiHelper({ retry: 3, retryDelay: 300 });

// Per-request override
api.get('/unstable-endpoint', { retry: 2, retryDelay: 200 });
```

---

### Custom Error Formatting

```js
const api = createApiHelper({
  errorFormatter: (err) => ({
    status: err.response?.status,
    message: err.message,
    url: err.config?.url
  })
});
```

---

## ✅ Example Response

```js
const { data, error } = await api.get('/posts/1');

if (error) {
  console.error(error);
} else {
  console.log(data);
}
```

---

## 💡 Why Use apiwiz?

* Removes repetitive `try-catch` blocks
* Cleaner, consistent API responses
* Built-in support for authentication, retries, timeouts, and cancellations
* Minimal and flexible — works with any backend project

---

### ✅ Final Tips Before Publishing:

- Make sure your `README.md` is in the root of your npm package.
- In `package.json`, verify:
```json
"files": [
  "README.md",
  "server.js"
]