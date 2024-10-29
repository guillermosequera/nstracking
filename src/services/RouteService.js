class RouteService {
  constructor() {
    if (RouteService.instance) {
      return RouteService.instance;
    }
    this.publicRoutes = ['/auth/signin', '/status'];
    RouteService.instance = this;
  }

  isPublicRoute(path) {
    return this.publicRoutes.includes(path);
  }

  addPublicRoute(path) {
    if (!this.isPublicRoute(path)) {
      this.publicRoutes.push(path);
    }
  }

  removePublicRoute(path) {
    const index = this.publicRoutes.indexOf(path);
    if (index > -1) {
      this.publicRoutes.splice(index, 1);
    }
  }
}

export const routeService = new RouteService();