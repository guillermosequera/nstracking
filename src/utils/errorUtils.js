export function handleApiError(error, defaultMessage) {
    console.error(`API Error: ${defaultMessage}`, error);
    if (error.response) {
      throw new Error(error.response.data.error || defaultMessage);
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(defaultMessage);
    }
  }