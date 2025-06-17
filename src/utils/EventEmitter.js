// EventEmitter.js - A replacement for react-native-event-listeners
class EventEmitter {
  constructor() {
    this.events = {};
    this.nextId = 0;
  }

  // Register an event handler
  addEventListener(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = {};
    }
    
    const id = String(this.nextId++);
    this.events[eventName][id] = callback;
    return id;
  }
  
  // Alias for addEventListener (for compatibility with other event emitters)
  addListener(eventName, callback) {
    return this.addEventListener(eventName, callback);
  }

  // Remove an event handler
  removeEventListener(listenerId) {
    if (!listenerId) return;
    
    // Search through all event types for this listener ID
    Object.keys(this.events).forEach(eventName => {
      if (this.events[eventName][listenerId]) {
        delete this.events[eventName][listenerId];
      }
    });
  }
  
  // Alias for removeEventListener (for compatibility)
  remove(listenerId) {
    return this.removeEventListener(listenerId);
  }

  // Emit an event with optional data
  emit(eventName, data) {
    if (!this.events[eventName]) return;
    
    Object.values(this.events[eventName]).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventName}:`, error);
      }
    });
  }
}

// Create and export a singleton instance
const eventEmitter = new EventEmitter();
export default eventEmitter;
