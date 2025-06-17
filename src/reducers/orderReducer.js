export const initialState = {
  orders: [],
  fees: [],
  currency: "",
  scheduled: [],
  deliveryScheduled: null,
  postponeOrder: false,
  loading: true,
  loadingOptions: false,
  isDeliveronOptions: false,
  deliveronOptions: null,
  deliveron: [],
  visible: false,
  itemId: null,
  itemTakeAway: null,
  isOpen: [],
  modalType: "",
  previousOrderCount: 0
};

export const orderReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ORDERS':
      // Get new order IDs that aren't in the current orders
      const currentOrderIds = new Set(state.orders.map(order => order.id));
      const newOrderIds = action.payload.orders
        .filter(order => !currentOrderIds.has(order.id))
        .map(order => order.id);

      // For initial load, open all orders by default
      // For subsequent loads, keep existing open/closed states and only open new orders
      let updatedIsOpen;
      if (state.orders.length === 0) {
        // First load - open all orders
        updatedIsOpen = [...action.payload.orders.map(order => order.id)];
      } else {
        // Subsequent loads - keep current open/closed states and add new orders as open
        updatedIsOpen = [...state.isOpen, ...newOrderIds];
      }
      
      return {
        ...state,
        orders: action.payload.orders,
        fees: action.payload.fees,
        currency: action.payload.currency,
        scheduled: action.payload.scheduled,
        loading: false,
        isOpen: updatedIsOpen
      };
    case 'TOGGLE_CONTENT':
      const isOpen = [...state.isOpen];
      const index = isOpen.indexOf(action.payload);
      if (index > -1) {
        // If ID is in the array, the card is open, so remove it to close it
        isOpen.splice(index, 1);
      } else {
        // If ID is not in the array, the card is closed, so add it to open it
        isOpen.push(action.payload);
      }
      return { ...state, isOpen };
    case 'SET_MODAL_STATE':
      return {
        ...state,
        visible: action.payload.visible,
        modalType: action.payload.modalType,
        itemId: action.payload.itemId,
        itemTakeAway: action.payload.itemTakeAway
      };
    case 'SET_DELIVERON_OPTIONS':
      return {
        ...state,
        deliveronOptions: action.payload.options,
        isDeliveronOptions: action.payload.isEnabled,
        loadingOptions: action.payload.loading
      };
    case 'SET_DELIVERON_DATA':
      return {
        ...state,
        deliveron: action.payload,
        loadingOptions: false
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'BATCH_UPDATE':
      return {
        ...state,
        ...action.payload,
        ...(action.payload.modalState && {
          visible: action.payload.modalState.visible,
          modalType: action.payload.modalState.modalType,
          itemId: action.payload.modalState.itemId,
          itemTakeAway: action.payload.modalState.itemTakeAway
        }),
        ...(action.payload.deliveron && { deliveron: action.payload.deliveron })
        };
    case 'SET_LOADING_OPTIONS':
      return { ...state, loadingOptions: action.payload };
    case 'UPDATE_ORDER_COUNT':
      return { ...state, previousOrderCount: action.payload };
    case 'RESET_MODAL_STATE':
      return {
        ...state,
        visible: false,
        isDeliveronOptions: false,
        loadingOptions: false,
        itemId: null,
        deliveron: []
      };
    case 'SET_DELIVERY_SCHEDULED':
      return {
        ...state,
        deliveryScheduled: action.payload
      };
    default:
      return state;
  }
};