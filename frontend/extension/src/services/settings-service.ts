/**
 * Settings Service
 * Handles user settings synchronization with backend
 */

export interface UserSettings {
  theme?: 'light' | 'dark';
  language?: 'en' | 'pt';
  soundAlerts?: boolean;
  shareInsights?: boolean;
  transactionMemory?: boolean;
  smartContractFingerprints?: boolean;
  aiRigidity?: number;
  aiLanguage?: 'en' | 'pt';
}

class SettingsService {
  private static instance: SettingsService;
  private API_BASE_URL: string;

  private constructor() {
    this.API_BASE_URL = import.meta.env.VITE_API_URL || 'https://vetra-production.up.railway.app/api';
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  /**
   * Get user settings from backend
   */
  public async getSettings(token: string): Promise<UserSettings> {
    try {
      console.log('📥 Fetching settings from backend...');
      
      const response = await fetch(`${this.API_BASE_URL}/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Settings received:', data.settings);
      
      return data.settings;
    } catch (error) {
      console.error('❌ Error fetching settings:', error);
      throw error;
    }
  }

  /**
   * Update user settings in backend
   */
  public async updateSettings(settings: UserSettings, token: string): Promise<UserSettings> {
    try {
      console.log('📤 Updating settings in backend...', settings);
      
      const response = await fetch(`${this.API_BASE_URL}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error(`Failed to update settings: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Settings updated:', data.settings);
      
      return data.settings;
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Update single setting
   */
  public async updateSetting(key: keyof UserSettings, value: any, token: string): Promise<void> {
    try {
      const settings = { [key]: value };
      await this.updateSettings(settings, token);
    } catch (error) {
      console.error(`❌ Error updating ${key}:`, error);
      throw error;
    }
  }
}

export default SettingsService;

