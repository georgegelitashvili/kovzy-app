import { useState, useCallback, useRef, useEffect, useContext } from 'react';
import { useAuthState } from '../context/AuthProvider';
import { LanguageContext } from '../components/Language';
import axiosInstance from '../apiConfig/apiRequests';

/**
 * Custom hook for managing order details fetching
 * Supports both batch loading (all at once) and lazy loading (on demand)
 * Implements caching and request deduplication
 */
export const useOrderDetails = () => {
  const { domain } = useAuthState();
  const { languageId } = useContext(LanguageContext);

  const [orderDetails, setOrderDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingFinished, setLoadingFinished] = useState(false);
  const [loadingOrderIds, setLoadingOrderIds] = useState(() => new Set());

  // Use refs to keep track of current state and prevent race conditions
  const orderDetailsRef = useRef({});
  const loadingOrdersRef = useRef(new Set()); // Track orders currently being loaded
  const pendingRequestsRef = useRef(new Map()); // Track pending requests by orderId
  const batchLoadingRef = useRef(false); // Track if batch loading is in progress
  const abortControllersRef = useRef(new Map()); // Track abort controllers by orderId

  const markOrderLoading = useCallback((orderIdStr, isLoading) => {
    if (isLoading) {
      loadingOrdersRef.current.add(orderIdStr);
      setLoadingOrderIds(prev => {
        if (prev.has(orderIdStr)) return prev;
        const next = new Set(prev);
        next.add(orderIdStr);
        return next;
      });
      return;
    }

    loadingOrdersRef.current.delete(orderIdStr);
    setLoadingOrderIds(prev => {
      if (!prev.has(orderIdStr)) return prev;
      const next = new Set(prev);
      next.delete(orderIdStr);
      return next;
    });
  }, []);

  // Keep ref in sync with state - FIXED: Use functional update to prevent race conditions
  useEffect(() => {
    orderDetailsRef.current = orderDetails;
  }, [orderDetails]);

  // Clear cached order details when language changes
  useEffect(() => {
    setOrderDetails({});
    orderDetailsRef.current = {};
    loadingOrdersRef.current.clear();
    setLoadingOrderIds(new Set());
    pendingRequestsRef.current.clear();
    batchLoadingRef.current = false;
    abortControllersRef.current.forEach(ctrl => ctrl.abort());
    abortControllersRef.current.clear();
  }, [languageId]);

  /**
   * Fetch details for a single order
   * Implements request deduplication and caching
   */
  const fetchSingleOrderDetails = useCallback(async (orderId, abortSignal, options = {}) => {
    const { force = false } = options;
    // Always use string orderId for all cache and map operations
    const orderIdStr = String(orderId);

    // Cached only when we have a successful response (including empty cart)
    if (!force && orderDetailsRef.current[orderIdStr] !== undefined) {
      return orderDetailsRef.current[orderIdStr];
    }

    // Check if this order is already being fetched
    if (loadingOrdersRef.current.has(orderIdStr)) {
      return pendingRequestsRef.current.get(orderIdStr);
    }

    // Create a new promise for this request
    const requestPromise = (async () => {
      try {
        markOrderLoading(orderIdStr, true);

        // Create AbortController if not provided
        let localAbortController;
        let signalToUse = abortSignal;
        if (!abortSignal) {
          localAbortController = new AbortController();
          abortControllersRef.current.set(orderIdStr, localAbortController);
          signalToUse = localAbortController.signal;
        }
        const response = await axiosInstance.post(
          `https://${domain}/api/v1/admin/getOrderCart`,
          { Orderid: orderIdStr, Languageid: languageId },
          { timeout: 10000, signal: signalToUse }
        );

        // OMA wraps cart as { data: [...] }; tolerate a raw array too
        const raw = response?.data?.data ?? response?.data;
        let orderData = [];
        if (Array.isArray(raw)) {
          orderData = raw;
        } else if (Array.isArray(raw?.data)) {
          orderData = raw.data;
        } else if (raw && typeof raw === 'object' && raw.status != null && raw.status < 0) {
          // API error payload — do not cache as empty success
          throw new Error(raw.message || 'Failed to load order cart');
        }

        if (__DEV__) {
          console.log(`✅ Successfully fetched order ${orderId} details (${orderData.length} items)`);
        }

        setOrderDetails(prev => {
          const updated = { ...prev, [orderIdStr]: orderData };
          orderDetailsRef.current = updated;
          return updated;
        });

        return orderData;

      } catch (err) {
        const isCancelled =
          err?.name === 'CanceledError' ||
          err?.name === 'AbortError' ||
          err?.code === 'ERR_CANCELED';

        if (__DEV__ && !isCancelled) {
          console.warn(`❌ Error fetching order ${orderId} details:`, err?.message || err);
        }

        // Do NOT cache failures as [] — that blocked retries forever
        // (empty array is truthy, so expand/batch would never refetch)
        return [];
      } finally {
        markOrderLoading(orderIdStr, false);
        pendingRequestsRef.current.delete(orderIdStr);
        abortControllersRef.current.delete(orderIdStr);
      }
    })();

    // Store the promise so other calls can wait for it
    pendingRequestsRef.current.set(orderIdStr, requestPromise);
    return requestPromise;
  }, [domain, languageId, markOrderLoading]);

  /**
   * Fetch details for multiple orders in batch
   * FIXED: Improved batch loading to prevent flickering
   * @param {Array} orderIds - Array of order IDs to fetch details for
   * @param {boolean} showLoader - Whether to show loading state
   * @param {boolean} waitForAll - If true, waits for all requests to complete before resolving
   * @returns {Promise} - Resolves when all requests are complete (if waitForAll is true)
   */
  const fetchBatchOrderDetails = useCallback(async (orderIds, showLoader = false, waitForAll = true) => {
    if (!orderIds || orderIds.length === 0) return;

    // console.log('[fetchBatchOrderDetails] Requested orderIds:', orderIds);
    // Filter out duplicates and already cached orders
    const orderIdsStr = orderIds.map(id => String(id));
    const orderIdsToFetch = [...new Set(orderIdsStr)].filter(orderId =>
      orderDetailsRef.current[orderId] === undefined && !loadingOrdersRef.current.has(orderId)
    );

    if (orderIdsToFetch.length === 0) {
      if (__DEV__) {
        console.log(`[fetchBatchOrderDetails] All ${orderIds.length} requested orders are either cached or being fetched`);
      }
      return;
    }

    const cachedCount = orderIds.length - orderIdsToFetch.length;

    // FIXED: Only set loading state if not already batch loading and showLoader is true
    if (showLoader && !batchLoadingRef.current) {
      setLoadingDetails(true);
      batchLoadingRef.current = true;
    }

    setLoadingFinished(false);

    // Create a single AbortController for the batch
    const batchAbortController = new AbortController();
    orderIdsToFetch.forEach(orderId => {
      abortControllersRef.current.set(orderId, batchAbortController);
    });

    try {
      // Create batch of promises for new fetches
      const detailPromises = orderIdsToFetch.map(async orderId => {
        const result = await fetchSingleOrderDetails(orderId, batchAbortController.signal);
        // console.log(`[fetchBatchOrderDetails] API response for orderId ${orderId}:`, result);
        return result;
      });

      if (waitForAll) {
        // Wait for new fetches and any existing pending requests
        const allPromises = [...detailPromises];

        // Add any existing pending requests for other orders in the list
        orderIdsStr.forEach(orderId => {
          const pendingRequest = pendingRequestsRef.current.get(orderId);
          if (pendingRequest && !orderIdsToFetch.includes(orderId)) {
            allPromises.push(pendingRequest);
          }
        });

        await Promise.allSettled(allPromises);
        setLoadingFinished(true);
      } else {
        // Fire and forget - don't wait for completion
        Promise.allSettled(detailPromises).catch(console.error);
      }
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        if (__DEV__) {
          console.log('Batch request cancelled');
        }
      } else {
        console.error('❌ Error in batch fetching order details:', error);
      }
    } finally {
      // FIXED: Only reset loading state if this batch operation set it
      if (showLoader && batchLoadingRef.current) {
        setLoadingDetails(false);
        batchLoadingRef.current = false;
      }
      // Clean up abort controllers for this batch
      orderIdsToFetch.forEach(orderId => {
        abortControllersRef.current.delete(orderId);
      });
    }
  }, [fetchSingleOrderDetails]);

  /**
   * Fetch details for a single order (lazy loading version)
   * Only fetches if not already loaded
   */
  const fetchOrderDetailsLazy = useCallback(async (orderId, force = false) => {
    const orderIdStr = String(orderId);
    if (!force && orderDetailsRef.current[orderIdStr] !== undefined) {
      return orderDetailsRef.current[orderIdStr];
    }

    return await fetchSingleOrderDetails(orderIdStr, undefined, { force });
  }, [fetchSingleOrderDetails]);

  /**
   * Clear all order details and reset loading states
   */
  const clearOrderDetails = useCallback(() => {
    if (__DEV__) {
      console.log('[useOrderDetails] clearOrderDetails called');
    }
    setOrderDetails(prev => {
      return {};
    });
    setLoadingFinished(false);
    setLoadingDetails(false); // FIXED: Also reset loading state
    orderDetailsRef.current = {};
    loadingOrdersRef.current.clear();
    setLoadingOrderIds(new Set());
    pendingRequestsRef.current.clear();
    batchLoadingRef.current = false; // FIXED: Reset batch loading flag
    abortControllersRef.current.forEach(ctrl => ctrl.abort());
    abortControllersRef.current.clear();
  }, []);

  /**
   * Invalidate cached details for a single order so the next fetch reloads them
   */
  const invalidateOrderDetails = useCallback((orderId) => {
    const orderIdStr = String(orderId);
    setOrderDetails(prev => {
      const updated = { ...prev };
      delete updated[orderIdStr];
      orderDetailsRef.current = updated;
      return updated;
    });
    markOrderLoading(orderIdStr, false);
    pendingRequestsRef.current.delete(orderIdStr);
    const ctrl = abortControllersRef.current.get(orderIdStr);
    if (ctrl) {
      ctrl.abort();
      abortControllersRef.current.delete(orderIdStr);
    }
  }, [markOrderLoading]);

  /**
   * Check if order details are loaded for a specific order
   */
  const isOrderDetailsLoaded = useCallback((orderId) => {
    return orderDetailsRef.current[String(orderId)] !== undefined;
  }, []);

  /**
   * Get order details for a specific order
   * FIXED: Always return array to prevent undefined issues
   */
  const getOrderDetails = useCallback((orderId) => {
    return orderDetails[String(orderId)] || [];
  }, [orderDetails]);

  /**
   * Check if order details are currently being fetched
   */
  const isOrderLoading = useCallback((orderId) => {
    return loadingOrderIds.has(String(orderId));
  }, [loadingOrderIds]);

  // Cancel all requests on unmount
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach(ctrl => ctrl.abort());
      abortControllersRef.current.clear();
    };
  }, []);

  return {
    orderDetails,
    loadingDetails,
    loadingFinished,
    fetchSingleOrderDetails,
    fetchBatchOrderDetails,
    fetchOrderDetailsLazy,
    clearOrderDetails,
    invalidateOrderDetails,
    isOrderDetailsLoaded,
    isOrderLoading,
    getOrderDetails,
  };
};