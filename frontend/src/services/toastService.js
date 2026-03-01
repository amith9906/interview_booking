const listeners = new Set();

const notify = (payload) => {
  listeners.forEach((listener) => listener(payload));
};

export const subscribeToast = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const toastSuccess = (message) => {
  notify({ type: 'success', message });
};

export const toastError = (message) => {
  notify({ type: 'error', message });
};

export const toastInfo = (message) => {
  notify({ type: 'info', message });
};
