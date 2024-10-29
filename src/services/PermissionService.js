import googleSheetsService from '../services/googleSheetsService';

export class PermissionService {
  constructor() {
    this.sheetId = process.env.NEXT_PUBLIC_SHEET_ID_PERMISSIONS_SHEET;
    this.range = 'Permissions!A:D'; // Asumiendo que las columnas son: Role, Action, Resource, Allowed
  }

  async getPermissions() {
    return await googleSheetsService.getSheetData(this.sheetId, this.range);
  }

  async hasPermission(userRole, action, resource) {
    try {
      const permissions = await googleSheetsService.getSheetData(this.sheetId, this.range);
      return permissions.some(row => 
        row[0] === userRole && 
        row[1] === action && 
        row[2] === resource && 
        row[3] === 'true'
      );
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  async getRolePermissions(userRole) {
    try {
      const permissions = await this.getPermissions();
      return permissions.filter(row => row[0] === userRole);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      return [];
    }
  }

  async addPermission(userRole, action, resource) {
    try {
      await googleSheetsService.appendSheetData(
        this.sheetId,
        this.range,
        [[userRole, action, resource, 'true']]
      );
    } catch (error) {
      console.error('Error adding permission:', error);
    }
  }

  async removePermission(userRole, action, resource) {
    try {
      const permissions = await this.getPermissions();
      const updatedPermissions = permissions.filter(row => 
        !(row[0] === userRole && row[1] === action && row[2] === resource)
      );

      await googleSheetsService.appendSheetData(
        this.sheetId,
        this.range,
        updatedPermissions
      );
    } catch (error) {
      console.error('Error removing permission:', error);
    }
  }
}