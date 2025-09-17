// types
interface HttpError extends Error {
  status: number;
  statusText: string;
  body: {message?: string; errors?: string[]};
}

// function
const fetch = (url: string, fetchOptions: {[key: string]: any}) => {
  return new Promise<any>(async (resolve, reject) => {
    try {
      const res = await globalThis.fetch(url, fetchOptions);

      if (!res.ok) {
        const err = await throwForBadResponse(res);
        reject(err);
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const data = await res.json();
          resolve(data);
        } catch (jsonError) {
          reject(new Error('Invalid JSON response'));
        }
      } else {
        try {
          const textData = await res.text();
          resolve(textData);
        } catch (textError) {
          reject(new Error('Failed to read response as text'));
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};

// helpers
async function throwForBadResponse(res: Response) {
  const {status, statusText} = res;
  const ct = res.headers.get('content-type') || '';

  // prefer json if server header is json
  if (ct.includes('application/json')) {
    try {
      const body = await res.json();
      throw makeHttpError(status, statusText, body);
    } catch {
      // fallthrough to attempt text if JSON parsing fails
    }
  }

  // …otherwise read as text, but still try to parse in case it's JSON without a header
  const raw = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    /* not JSON */
  }

  throw makeHttpError(status, statusText, parsed ?? raw);
}

function makeHttpError(
  status: number,
  statusText: string,
  body: {message?: string; errors?: string[]} | string,
): HttpError {
  let msg = `HTTP ${status} ${statusText}`;
  let normalizedBody: {message?: string; errors?: string[]};

  if (typeof body === 'string' && body.trim()) {
    msg = body;
    normalizedBody = {message: body.trim()};
  } else if (body && typeof body === 'object') {
    normalizedBody = body;
    const m = typeof body.message === 'string' ? body.message.trim() : '';
    const e = Array.isArray(body.errors)
      ? body.errors.filter(Boolean).join(', ')
      : '';
    if (m) msg = m;
    else if (e) msg = e;
  } else {
    normalizedBody = {message: msg};
  }

  const err = new Error(msg) as HttpError;
  err.name = 'HttpError';
  err.status = status;
  err.statusText = statusText;
  err.body = normalizedBody;

  return err;
}
export default fetch;
