import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { removeData } from "../helpers/storage";
import eventEmitter from "../utils/EventEmitter";
import { getSecureData } from '../helpers/storage';
import NetInfo from '@react-native-community/netinfo';

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;
const RETRY_DELAY = 200;
const MAX_RETRIES = 1;
const INITIAL_TIMEOUT = 5000;

// Enhanced domain validation
const isValidDomain = (url) => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Basic domain format validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    // Check for obvious invalid patterns
    const invalidPatterns = [
      /\s/,           // Contains whitespace
      /\.\./,         // Double dots
      /^-/,           // Starts with hyphen
      /-$/,           // Ends with hyphen
      /^\.|\.$/,
      /[^a-zA-Z0-9.-]/ // Invalid characters
    ];

    return domainRegex.test(domain) && !invalidPatterns.some(pattern => pattern.test(domain));
  } catch {
    return false;
  }
};

// Enhanced error detection function
const detectSpecificError = async (error, url) => {
  console.log('=== DETAILED ERROR ANALYSIS ===');
  console.log('Error object keys:', Object.keys(error));
  console.log('Error message:', error.message);
  console.log('Error code:', error.code);
  console.log('Error cause:', error.cause);
  console.log('Error errno:', error.errno);
  console.log('Error syscall:', error.syscall);
  console.log('Error hostname:', error.hostname);
  console.log('Error stack (first 500 chars):', error.stack?.substring(0, 500));
  console.log('Config URL:', error.config?.url);

  const errorInfo = {
    type: 'NETWORK_ERROR',
    isSpecific: false,
    details: null
  };

  // 1. Pre-validate domain format
  if (url && !isValidDomain(url)) {
    console.log('❌ Invalid domain format detected');
    return {
      type: 'INVALID_DOMAIN',
      isSpecific: true,
      details: 'Domain format is invalid'
    };
  }

  // 2. Check ALL error properties for DNS/domain clues
  const errorMessage = (error.message || '').toLowerCase();
  const errorStack = (error.stack || '').toLowerCase();
  const errorCode = error.code;
  const errorCause = error.cause ? JSON.stringify(error.cause).toLowerCase() : '';
  const errorSyscall = (error.syscall || '').toLowerCase();
  const errorHostname = error.hostname || '';

  console.log('Checking error patterns in:', {
    message: errorMessage,
    stack: errorStack.substring(0, 200),
    cause: errorCause,
    syscall: errorSyscall,
    hostname: errorHostname
  });

  // Enhanced DNS-related error patterns
  const dnsPatterns = [
    /enotfound/,
    /eai_again/,
    /eai_nodata/,
    /eai_noname/,
    /dns.*error/,
    /dns.*fail/,
    /domain.*not.*found/,
    /could not resolve/,
    /name resolution/,
    /getaddrinfo.*failed/,
    /getaddrinfo.*enotfound/,
    /nodename nor servname/,
    /unknown host/,
    /host.*not.*found/,
    /hostname.*not.*found/,
    /server.*not.*found/,
    /resolve.*fail/,
    /lookup.*fail/,
    /nxdomain/
  ];

  // Check all error sources for DNS patterns
  const allErrorText = `${errorMessage} ${errorStack} ${errorCause} ${errorSyscall}`;
  const isDnsError = dnsPatterns.some(pattern => pattern.test(allErrorText));

  if (isDnsError) {
    console.log('🔍 DNS error pattern matched:', dnsPatterns.find(p => p.test(allErrorText)));
    return {
      type: 'INVALID_DOMAIN',
      isSpecific: true,
      details: 'DNS resolution failed - domain may not exist'
    };
  }

  // 3. Check for specific syscalls that indicate DNS issues
  if (errorSyscall === 'getaddrinfo') {
    console.log('🔍 getaddrinfo syscall detected - likely DNS issue');
    return {
      type: 'INVALID_DOMAIN',
      isSpecific: true,
      details: 'DNS lookup failed'
    };
  }

  // 4. Connection refused vs timeout differentiation
  const connectionRefusedPatterns = [
    /econnrefused/,
    /connection refused/,
    /connect.*refused/
  ];

  if (connectionRefusedPatterns.some(pattern => pattern.test(allErrorText))) {
    console.log('🔍 Connection refused pattern matched');
    return {
      type: 'CONNECTION_REFUSED',
      isSpecific: true,
      details: 'Server refused connection - service may be down'
    };
  }

  // 5. SSL/TLS certificate errors
  const sslPatterns = [
    /certificate/,
    /ssl.*error/,
    /tls.*error/,
    /cert.*invalid/,
    /security.*error/,
    /handshake.*fail/,
    /unable to verify/
  ];

  if (sslPatterns.some(pattern => pattern.test(allErrorText))) {
    console.log('🔍 SSL error pattern matched');
    return {
      type: 'SSL_ERROR',
      isSpecific: true,
      details: 'SSL/TLS certificate error'
    };
  }

  // 6. Timeout specific detection
  const timeoutPatterns = [
    /timeout/,
    /timed.*out/,
    /etimedout/
  ];

  if (errorCode === 'ECONNABORTED' || timeoutPatterns.some(pattern => pattern.test(allErrorText))) {
    console.log('🔍 Timeout pattern matched');
    return {
      type: 'REQUEST_TIMEOUT',
      isSpecific: true,
      details: 'Request timed out'
    };
  }

  // 7. Check network connectivity
  try {
    const netInfo = await NetInfo.fetch();
    console.log('Network info:', netInfo);
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      console.log('🔍 No internet connection detected');
      return {
        type: 'NO_INTERNET',
        isSpecific: true,
        details: 'No internet connection available'
      };
    }
  } catch (netError) {
    console.log('NetInfo check failed:', netError);
  }

  // 8. Enhanced domain analysis for ERR_NETWORK without external dependencies
  if (url && errorCode === 'ERR_NETWORK') {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      console.log('🔍 Analyzing domain:', domain);

      // Check if it's a localhost or development domain that should work
      const developmentPatterns = [
        /^localhost$/,
        /^127\.0\.0\.1$/,
        /^192\.168\.\d+\.\d+$/,
        /^10\.\d+\.\d+\.\d+$/,
        /\.local$/,
        /ngrok\.io$/,
        /\.ngrok\.io$/
      ];

      const isDevelopmentDomain = developmentPatterns.some(pattern => pattern.test(domain));

      if (isDevelopmentDomain) {
        console.log('🏠 Development domain detected, likely connection issue rather than invalid domain');
        return {
          type: 'CONNECTION_REFUSED',
          isSpecific: true,
          details: 'Development server may be down'
        };
      }

      // Check for suspicious domain patterns that are likely invalid
      const suspiciousPatterns = [
        /^tst\./,           // "tst" subdomain (test domain that might not exist)
        /^test\./,          // "test" subdomain
        /^staging\./,       // staging might not be accessible
        /^dev\./,           // dev subdomain
        /\.test$/,          // .test TLD (reserved for testing)
        /\.example$/,       // .example TLD (reserved)
        /\.invalid$/,       // .invalid TLD (reserved)
        /\.fake$/           // .fake domains
      ];

      const isSuspiciousDomain = suspiciousPatterns.some(pattern => pattern.test(domain));

      if (isSuspiciousDomain) {
        console.log('⚠️ Suspicious domain pattern detected, likely invalid:', domain);
        return {
          type: 'INVALID_DOMAIN',
          isSpecific: true,
          details: 'Domain appears to be a test/development domain that may not exist'
        };
      }

      // For production domains, since we have internet connectivity, 
      // ERR_NETWORK is most likely an invalid domain
      if (domain.includes('.com') || domain.includes('.org') || domain.includes('.net') ||
        domain.includes('.io') || domain.includes('.co')) {
        console.log('🌐 Production domain with ERR_NETWORK likely means invalid domain');
        return {
          type: 'INVALID_DOMAIN',
          isSpecific: true,
          details: 'Domain may not exist or be unreachable'
        };
      }

    } catch (urlError) {
      console.log('❌ URL parsing failed:', urlError);
    }
  }

  console.log('❓ Could not determine specific error type');
  return errorInfo;
};

// Remove the DNS test function since it's causing issues

// ONLY these errors should be shown to users
const USER_VISIBLE_ERROR_TYPES = [
  'NETWORK_ERROR',
  'NOT_FOUND',
  'INVALID_DOMAIN',
  'CONNECTION_REFUSED',
  'SSL_ERROR',
  'REQUEST_TIMEOUT',
  'NO_INTERNET'
];

// Updated technical error patterns
const TECHNICAL_ERROR_PATTERNS = [
  /failed to load/i,
  /music/i,
  /audio/i,
  /sound/i,
  /cannot read/i,
  /undefined/i,
  /null/i,
  /function/i,
  /error code/i,
  /exception/i,
  /stack/i,
  /syntax/i,
  /reference/i,
  /type error/i
];

const axiosInstance = axios.create({
  timeout: INITIAL_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Clear expired cache entries
const clearCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
};

setInterval(clearCache, CACHE_DURATION);

const checkInternetConnection = async () => {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected && netInfo.isInternetReachable;
};

const shouldShowError = (errorType, errorMessage) => {
  if (!USER_VISIBLE_ERROR_TYPES.includes(errorType)) {
    return false;
  }

  if (errorMessage && TECHNICAL_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage))) {
    return false;
  }

  return true;
};

const handleApiError = async (error, dictionary) => {
  let errorType = 'UNKNOWN';
  let errorMessage = '';
  let statusCode = error.response?.status;
  let showToUser = false;

  console.log('Raw error:', error);

  // Use enhanced error detection for network errors
  if (!error.response && error.code === 'ERR_NETWORK') {
    const specificError = await detectSpecificError(error, error.config?.url);

    errorType = specificError.type;
    showToUser = USER_VISIBLE_ERROR_TYPES.includes(errorType);

    // Set appropriate error messages
    switch (errorType) {
      case 'INVALID_DOMAIN':
        errorMessage = dictionary?.['errors.INVALID_DOMAIN'] || 'დომენი არასწორია ან არ არსებობს';
        break;
      case 'CONNECTION_REFUSED':
        errorMessage = dictionary?.['errors.CONNECTION_REFUSED'] || 'სერვერი კავშირს უარყოფს';
        break;
      case 'SSL_ERROR':
        errorMessage = dictionary?.['errors.SSL_ERROR'] || 'SSL სერტიფიკატის პრობლემა';
        break;
      case 'REQUEST_TIMEOUT':
        errorMessage = dictionary?.['errors.REQUEST_TIMEOUT'] || 'მოთხოვნის დრო ამოიწურა';
        break;
      case 'NO_INTERNET':
        errorMessage = dictionary?.['errors.NO_INTERNET'] || 'ინტერნეტ კავშირი არ არის';
        break;
      default:
        errorMessage = dictionary?.['errors.NETWORK_ERROR'] || 'ქსელთან კავშირის პრობლემა';
    }

    console.log(`Enhanced error detection: ${errorType} - ${specificError.details || 'No additional details'}`);
  }
  // Handle timeout errors specifically
  else if (!error.response && error.code === 'ECONNABORTED') {
    errorType = 'REQUEST_TIMEOUT';
    errorMessage = dictionary?.['errors.REQUEST_TIMEOUT'] || 'მოთხოვნის დრო ამოიწურა';
    showToUser = true;
  }
  // Handle response errors
  else if (error.response) {
    // Check for new API error format: { error: { message, code, status } }
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      errorMessage = apiError.message || '';
      errorType = apiError.code || 'API_ERROR';
      statusCode = apiError.status || statusCode;
      
      // Determine if this error should be shown to user based on status code
      if ([404, 422, 503].includes(statusCode)) {
        showToUser = true;
      }
    } else {
      // Fallback to status code mapping for old format
      switch (statusCode) {
        case 400:
          errorType = 'BAD_REQUEST';
          break;
        case 401:
          errorType = 'UNAUTHORIZED';
          break;
        case 403:
          errorType = 'FORBIDDEN';
          break;
        case 404:
          errorType = 'NOT_FOUND';
          showToUser = true;
          break;
        case 422:
          errorType = 'VALIDATION_ERROR';
          showToUser = true;
          break;
        case 500:
          errorType = 'SERVER_ERROR';
          break;
        case 502:
          errorType = error.config?.url?.includes('ngrok') ? 'NGROK_ERROR' : 'BAD_GATEWAY';
          break;
        case 503:
          errorType = 'SERVICE_UNAVAILABLE';
          showToUser = true;
          break;
        default:
          errorType = 'UNKNOWN_ERROR';
      }
    }
  }

  // Use translated message if available and not already set
  if (!errorMessage) {
    const translatedMessage = dictionary?.[`errors.${errorType}`];
    errorMessage = translatedMessage || error.message || 'Unknown error';
  }

  // Double-check if this error should be shown
  showToUser = shouldShowError(errorType, errorMessage);

  // Always log all errors for debugging
  console.error('API Error (will' + (showToUser ? '' : ' not') + ' be shown to user):', {
    type: errorType,
    message: errorMessage,
    statusCode,
    url: error.config?.url,
    response: error.response?.data
  });

  // Only show errors to the user if they are explicitly allowed
  if (showToUser) {
    eventEmitter.emit('showToast', {
      type: 'failed',
      title: dictionary ? dictionary["info.warning"] : 'Error',
      subtitle: errorMessage
    });

    if (global.errorHandler) {
      global.errorHandler.setError(errorType, errorMessage);
    }
  }

  return {
    type: errorType,
    message: errorMessage,
    statusCode,
    originalError: error,
    showToUser
  };
};

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Pre-validate domain before making request
      if (config.url && !isValidDomain(config.url)) {
        const customError = new Error('Invalid domain format');
        customError.code = 'INVALID_DOMAIN';
        customError.config = config;
        throw customError;
      }

      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        const customError = new Error('No internet connection');
        customError.code = 'ERR_NETWORK';
        throw customError;
      }

      const token = await getSecureData('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      let dictionary = null;
      try {
        const languageContext = global.languageContext;
        if (languageContext) {
          dictionary = languageContext.dictionary;
        }
      } catch (e) { }
      return Promise.reject(await handleApiError(error, dictionary));
    }
  },
  async (error) => {
    console.error('Request interceptor error:', error);
    let dictionary = null;
    try {
      const languageContext = global.languageContext;
      if (languageContext) {
        dictionary = languageContext.dictionary;
      }
    } catch (e) { }
    return Promise.reject(await handleApiError(error, dictionary));
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get') {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    return response;
  },
  async (error) => {
    if (global.isLoggedOut) {
      return Promise.reject({ type: 'LOGGED_OUT_SUPPRESS', message: '', showToUser: false });
    }

    const originalRequest = error.config;
    let dictionary = null;
    try {
      const languageContext = global.languageContext;
      if (languageContext) {
        dictionary = languageContext.dictionary;
      }
    } catch (e) {
      console.warn('Could not access language context:', e);
    }

    if (error.response?.status === 401) {
      // Skip interceptor handling for login endpoints - let the login function handle it
      if (originalRequest.url && originalRequest.url.includes('/auth/login')) {
        console.log('[API Interceptor] Skipping 401 handling for login endpoint, letting login function handle it');
        return Promise.reject(error);
      }
      
      // Check errorMsg for session expired vs invalid credentials (supports new error format)
      const errorMsg = error.response?.data?.error?.message || error.response?.error?.message || "";
      const errorCode = error.response?.data?.error?.code || "";
      
      // If errorMsg contains 'სესია' or 'session' and does NOT contain 'match', 'credentials', 'user', treat as session expired
      if (
        typeof errorMsg === 'string' &&
        (errorMsg.toLowerCase().includes('სესია') || errorMsg.toLowerCase().includes('session')) &&
        !/(match|credentials|user|password|auth|პაროლ|მომხმარებ)/i.test(errorMsg)
      ) {
        try {
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('user');
          await SecureStore.deleteItemAsync('credentials');
          eventEmitter.emit('sessionExpired');
        } catch (e) {
          console.error('Error clearing auth data:', e);
        }
      }
      return Promise.reject(await handleApiError(error, dictionary));
    }

    // Enhanced retry logic - but don't retry invalid domain errors
    if (originalRequest &&
      (!error.response || error.response.status >= 500 ||
        error.code === 'ECONNABORTED' || error.message.includes('Network Error')) &&
      error.code !== 'INVALID_DOMAIN') { // Don't retry invalid domains

      originalRequest._retry = (originalRequest._retry || 0) + 1;

      if (originalRequest._retry <= MAX_RETRIES) {
        console.log(`Retrying request (${originalRequest._retry}/${MAX_RETRIES})...`);

        const isConnected = await checkInternetConnection();
        if (!isConnected) {
          console.log('No internet connection, waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * 2));
        }

        const delay = RETRY_DELAY * Math.pow(2, originalRequest._retry - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        originalRequest.timeout = INITIAL_TIMEOUT * Math.pow(1.5, originalRequest._retry);

        return axiosInstance(originalRequest);
      }
    }

    const formattedError = await handleApiError(error, dictionary);
    return Promise.reject(formattedError);
  }
);

export default axiosInstance;