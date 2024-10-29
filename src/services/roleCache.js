// src/services/roleCache.js
class RoleCache {
  constructor() {
    if (RoleCache.instance) {
      return RoleCache.instance;
    }
    this.cache = new Map();
    RoleCache.instance = this;
  }

  get(email) {
    return this.cache.get(email);
  }

  set(email, role) {
    this.cache.set(email, role);
  }

  has(email) {
    return this.cache.has(email);
  }

  clear() {
    this.cache.clear();
  }
}

export const roleCache = new RoleCache();