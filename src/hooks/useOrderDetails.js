import { useState, useCallback, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthProvider';
import { LanguageContext } from '../components/Language';
import axiosInstance from '../apiConfig/apiRequests';

/**
 * Custom hook for managing order details fetching
 * Supports both batch loading (all at once) and lazy loading (on demand)
 * Implements caching and request deduplication
 */
export const useOrderDetails = () => {
  const { domain } = useContext(AuthContext);
  const { languageId } = useContext(LanguageContext);

  const [orderDetails, setOrderDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingFinished, setLoadingFinished] = useState(false);

  // Use refs to keep track of current state and prevent race conditions
  const orderDetailsRef = useRef({});
  const loadingOrdersRef = useRef(new Set()); // Track orders currently being loaded
  const pendingRequestsRef = useRef(new Map()); // Track pending requests by orderId
  const batchLoadingRef = useRef(false); // Track if batch loading is in progress
  const abortControllersRef = useRef(new Map()); // Track abort controllers by orderId

  // Keep ref in sync with state - FIXED: Use functional update to prevent race conditions
  useEffect(() => {
    orderDetailsRef.current = orderDetails;
  }, [orderDetails]);

  // Clear cached order details when language changes
  useEffect(() => {
    setOrderDetails({});
    orderDetailsRef.current = {};
    loadingOrdersRef.current.clear();
    pendingRequestsRef.current.clear();
    batchLoadingRef.current = false;
    abortControllersRef.current.forEach(ctrl => ctrl.abort());
    abortControllersRef.current.clear();
  }, [languageId]);

  /**
   * Fetch details for a single order
   * Implements request deduplication and caching
   */
  const fetchSingleOrderDetails = useCallback(async (orderId, abortSignal) => {
    // Always use string orderId for all cache and map operations
    const orderIdStr = String(orderId);
    // Check if already cached using ref for current state
    if (orderDetailsRef.current[orderIdStr]) {
      // console.log(`🔵 Order ${orderIdStr} details already cached, skipping`);
      return orderDetailsRef.current[orderIdStr];
    }

    // Check if this order is already being fetched
    if (loadingOrdersRef.current.has(orderIdStr)) {
      // console.log(`⏳ Order ${orderIdStr} details are already being fetched, waiting...`);
      return pendingRequestsRef.current.get(orderIdStr);
    }

    // Create a new promise for this request
    const requestPromise = (async () => {
      try {
        loadingOrdersRef.current.add(orderIdStr);
        // console.log(`🔴 Fetching order ${orderId} details with languageId: ${languageId}`);

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
          { timeout: 3000, signal: signalToUse }
        );

        const data = response.data.data;
        const orderData = Array.isArray(data) ? data : [];

        console.log(`✅ Successfully fetched order ${orderId} details`);

        // FIXED: Use functional update to prevent race conditions
        setOrderDetails(prev => {
          const updated = { ...prev, [orderIdStr]: orderData };
          orderDetailsRef.current = updated; // Keep ref in sync immediately
          console.log('[useOrderDetails] setOrderDetails: keys now', Object.keys(updated));
          return updated;
        });

        return orderData;

      } catch (err) {
        // if (err.name === 'CanceledError' || err.name === 'AbortError') {
        //   console.log(`⛔️ Request for order ${orderId} was cancelled.`);
        // } else {
        //   console.log(`❌ Error fetching order ${orderId} details:`, err);
        // }
        const emptyArray = [];
        setOrderDetails(prev => {
          const updated = { ...prev, [orderIdStr]: emptyArray };
          orderDetailsRef.current = updated;
          // console.log('[useOrderDetails] setOrderDetails (error): keys now', Object.keys(updated));
          return updated;
        });
        return emptyArray;
      } finally {
        loadingOrdersRef.current.delete(orderIdStr);
        pendingRequestsRef.current.delete(orderIdStr);
        abortControllersRef.current.delete(orderIdStr);
      }
    })();

    // Store the promise so other calls can wait for it
    pendingRequestsRef.current.set(orderId, requestPromise);
    return requestPromise;
  }, [domain, languageId]);

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
      !orderDetailsRef.current[orderId] && !loadingOrdersRef.current.has(orderId)
    );

    if (orderIdsToFetch.length === 0) {
      console.log(`[fetchBatchOrderDetails] All ${orderIds.length} requested orders are either cached or being fetched`);
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
        console.log('Batch request cancelled');
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
  const fetchOrderDetailsLazy = useCallback(async (orderId) => {
    // Check if already cached using ref
    const orderIdStr = String(orderId);
    if (orderDetailsRef.current[orderIdStr]) {
      return orderDetailsRef.current[orderIdStr];
    }

    return await fetchSingleOrderDetails(orderIdStr);
  }, [fetchSingleOrderDetails]);

  /**
   * Clear all order details and reset loading states
   */
  const clearOrderDetails = useCallback(() => {
    console.log('[useOrderDetails] clearOrderDetails called');
    setOrderDetails(prev => {
      return {};
    });
    setLoadingFinished(false);
    setLoadingDetails(false); // FIXED: Also reset loading state
    orderDetailsRef.current = {};
    loadingOrdersRef.current.clear();
    pendingRequestsRef.current.clear();
    batchLoadingRef.current = false; // FIXED: Reset batch loading flag
    abortControllersRef.current.forEach(ctrl => ctrl.abort());
    abortControllersRef.current.clear();
  }, []);

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
    return loadingOrdersRef.current.has(String(orderId));
  }, []);

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
    isOrderDetailsLoaded,
    isOrderLoading,
    getOrderDetails,
  };
};