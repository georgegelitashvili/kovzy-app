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
      // When orders are set, initialize all of them as open
      return {
        ...state,
        orders: action.payload.orders,
        fees: action.payload.fees,
        currency: action.payload.currency,
        scheduled: action.payload.scheduled,
        loading: false,
        isOpen: action.payload.orders.map(order => order.id) // Initialize all orders as open
      };
    case 'TOGGLE_CONTENT':
      const isOpen = [...state.isOpen];
      const index = isOpen.indexOf(action.payload);
      if (index > -1) {
        isOpen.splice(index, 1);
      } else {
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