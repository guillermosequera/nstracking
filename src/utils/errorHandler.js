// src/utils/errorHandler.js

// Función para inicializar el manejo de errores global
export function initErrorHandling() {
    if (typeof window !== 'undefined') {
      window.onerror = function(message, source, lineno, colno, error) {
        console.error('Global error caught:', error);
        // Aquí hay que agregar lógica para enviar el error a un servicio de monitoreo
      };
  
      window.onunhandledrejection = function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        // Aquí hay que agregar lógica para enviar el error a un servicio de monitoreo
      };
    }
  }
  
  // Función para manejar errores de fetch
  export function handleFetchError(error) {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Server error:', error.response.status, error.response.data);
      return `Error del servidor: ${error.response.status}`;
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      console.error('Network error:', error.request);
      return 'Error de red. Por favor, verifica tu conexión.';
    } else {
      // Algo sucedió al configurar la solicitud que provocó un error
      console.error('Request error:', error.message);
      return 'Error al realizar la solicitud.';
    }
  }
  
  // Función para manejar errores específicos de la aplicación
  export function handleAppError(error) {
    console.error('Application error:', error);
    // Aquí hay que agregar lógica para manejar errores específicos de tu aplicación
    return 'Ha ocurrido un error en la aplicación. Por favor, inténtalo de nuevo más tarde.';
  }
  
  // Función para mostrar mensajes de error al usuario
  export function showErrorToUser(message) {
    // Aquí hay que implementar la lógica para mostrar el error al usuario
    // Por ejemplo, usando un estado global o un sistema de notificaciones
    console.error('Error to show to user:', message);
    // Ejemplo: alert(message);
  }