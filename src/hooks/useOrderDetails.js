import { useState, useCallback, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthProvider';
import { LanguageContext } from '../components/Language';
import axiosInstance from '../apiConfig/apiRequests';

/**
 * Custom hook for managing order details fetching
 * Supports both batch loading (all at once) and lazy loading (on demand)
 */
export const useOrderDetails = () => {
  const { domain } = useContext(AuthContext);
  const { languageId } = useContext(LanguageContext);
  
  const [orderDetails, setOrderDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingFinished, setLoadingFinished] = useState(false);
  
  // Use a ref to keep track of current orderDetails for synchronous access
  const orderDetailsRef = useRef({});
  
  // Keep ref in sync with state
  useEffect(() => {
    orderDetailsRef.current = orderDetails;
  }, [orderDetails]);

  // Clear cached order details when language changes
  useEffect(() => {
    console.log(`🌐 Language changed to ${languageId}, clearing cached order details`);
    setOrderDetails({});
    orderDetailsRef.current = {}; // Also clear the ref
  }, [languageId]);

  /**
   * Fetch details for a single order
   */
  const fetchSingleOrderDetails = useCallback(async (orderId) => {
    // Check if already cached using ref for current state
    if (orderDetailsRef.current[orderId]) {
      console.log(`Order ${orderId} details already cached, skipping`);
      return orderDetailsRef.current[orderId];
    }

    console.log(`📋 Fetching order ${orderId} details with languageId: ${languageId}`);

    try {
      const response = await axiosInstance.post(
        `https://${domain}/api/v1/admin/getOrderCart`,
        { Orderid: orderId, Languageid: languageId },
        { timeout: 3000 }
      );
      
      const data = response.data.data;
      const orderData = Array.isArray(data) ? data : [];
      
      console.log("Fetched order details for orderId:", orderId);
      
      // Update state
      setOrderDetails(prev => ({
        ...prev,
        [orderId]: orderData
      }));
      return orderData;
      
    } catch (err) {
      console.log("Error fetching order details for orderId:", orderId, err);
      // Set empty array for failed requests
      const emptyArray = [];
      setOrderDetails(prev => ({
        ...prev,
        [orderId]: emptyArray
      }));
      return emptyArray;
    }
  }, [domain, languageId]);

  /**
   * Fetch details for multiple orders in batch
   * @param {Array} orderIds - Array of order IDs to fetch details for
   * @param {boolean} waitForAll - If true, waits for all requests to complete before resolving
   * @returns {Promise} - Resolves when all requests are complete (if waitForAll is true)
   */
  const fetchBatchOrderDetails = useCallback(async (orderIds, waitForAll = true) => {
    if (!orderIds || orderIds.length === 0) return;

    // Filter out orders that already have details using ref for current state
    const orderIdsToFetch = [...new Set(
      orderIds.filter(orderId => !orderDetailsRef.current[orderId])
    )];
    
    if (orderIdsToFetch.length === 0) {
      console.log(`All ${orderIds.length} requested orders already have cached details`);
      return;
    }

    console.log(`Batch fetching details for ${orderIdsToFetch.length} orders (${orderIds.length - orderIdsToFetch.length} already cached)`);
    setLoadingDetails(true);
    setLoadingFinished(false); 

    try {
      const detailPromises = orderIdsToFetch.map(orderId => 
        fetchSingleOrderDetails(orderId)
      );
      
      if (waitForAll) {
        await Promise.allSettled(detailPromises);
        setLoadingFinished(true); 
      } else {
        // Fire and forget - don't wait for completion
        Promise.allSettled(detailPromises);
      }
      
    } catch (error) {
      console.log('Error in batch fetching order details:', error);
    } finally {
      setLoadingDetails(false);
    }
  }, [fetchSingleOrderDetails]);

  /**
   * Fetch details for a single order (lazy loading version)
   * Only fetches if not already loaded
   */
  const fetchOrderDetailsLazy = useCallback(async (orderId) => {
    // Check if already cached using ref
    if (orderDetailsRef.current[orderId]) {
      return orderDetailsRef.current[orderId];
    }

    return await fetchSingleOrderDetails(orderId);
  }, [fetchSingleOrderDetails]);

  /**
   * Clear all order details
   */
  const clearOrderDetails = useCallback(() => {
    setOrderDetails({});
    setLoadingFinished(false);
  }, []);

  /**
   * Check if order details are loaded for a specific order
   */
  const isOrderDetailsLoaded = useCallback((orderId) => {
    return orderDetailsRef.current[orderId] !== undefined;
  }, []);

  /**
   * Get order details for a specific order
   */
  const getOrderDetails = useCallback((orderId) => {
    return orderDetails[orderId] || [];
  }, [orderDetails]);

  return {
    orderDetails,
    loadingDetails,
    loadingFinished,
    fetchSingleOrderDetails,
    fetchBatchOrderDetails,
    fetchOrderDetailsLazy,
    clearOrderDetails,
    isOrderDetailsLoaded,
    getOrderDetails,
  };
};
