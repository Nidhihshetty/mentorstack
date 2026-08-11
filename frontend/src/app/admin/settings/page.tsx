"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { 
  Settings, 
  Shield, 
  Database, 
  Globe, 
  Users, 
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";

interface PlatformSettings {
  siteName: string;
  siteDescription: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  moderationEnabled: boolean;
  maxQuestionsPerDay: number;
  maxArticlesPerDay: number;
  maintenanceMode: boolean;
}

export default function SettingsAdminPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    siteName: "MentorStack",
    siteDescription: "Professional mentorship and knowledge sharing platform",
    allowRegistration: true,
    requireEmailVerification: true,
    moderationEnabled: true,
    maxQuestionsPerDay: 10,
    maxArticlesPerDay: 5,
    maintenanceMode: false,
  });
  // removed unused loading state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'limits' | 'maintenance'>('general');

  const handleSettingChange = (key: keyof PlatformSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      // Simulate API call for saving settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch {
        // Surface a generic error message; no need to inspect error for now
        setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
      } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (confirm("Are you sure you want to reset all settings to default values? This action cannot be undone.")) {
      setSettings({
        siteName: "MentorStack",
        siteDescription: "Professional mentorship and knowledge sharing platform",
        allowRegistration: true,
        requireEmailVerification: true,
        moderationEnabled: true,
        maxQuestionsPerDay: 10,
        maxArticlesPerDay: 5,
        maintenanceMode: false,
      });
      setMessage({ type: 'info', text: 'Settings reset to default values. Remember to save your changes.' });
    }
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'limits' as const, label: 'Rate Limits', icon: Database },
    { id: 'maintenance' as const, label: 'Maintenance', icon: AlertTriangle },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
            <p className="text-gray-600">Configure and manage platform-wide settings</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetToDefaults}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset to Defaults</span>
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (() => {
          let styleClass: string;
          let Icon: any;
          if (message.type === 'success') {
            styleClass = 'bg-green-50 border-green-200 text-green-800';
            Icon = CheckCircle;
          } else if (message.type === 'error') {
            styleClass = 'bg-red-50 border-red-200 text-red-800';
            Icon = AlertTriangle;
          } else {
            styleClass = 'bg-blue-50 border-blue-200 text-blue-800';
            Icon = Info;
          }
          return (
            <output className={`p-4 rounded-lg border ${styleClass}`} aria-live="polite">
              <div className="flex items-center space-x-2">
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{message.text}</span>
              </div>
            </output>
          );
        })()}

        {/* Settings Panel */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                  
                  <div className="grid gap-6">
                    <div>
                      <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-2">
                        Site Name
                      </label>
                      <input
                        id="siteName"
                        type="text"
                        value={settings.siteName}
                        onChange={(e) => handleSettingChange('siteName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Enter site name"
                      />
                    </div>

                    <div>
                      <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-2">
                        Site Description
                      </label>
                      <textarea
                        id="siteDescription"
                        value={settings.siteDescription}
                        onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Enter site description"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span id="allowRegistrationLabel" className="text-sm font-medium text-gray-700">
                            Allow New User Registration
                          </span>
                          <p className="text-xs text-gray-500">Allow new users to create accounts</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer" aria-labelledby="allowRegistrationLabel">
                          <input
                            type="checkbox"
                            checked={settings.allowRegistration}
                            onChange={(e) => handleSettingChange('allowRegistration', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span id="requireEmailVerificationLabel" className="text-sm font-medium text-gray-700">
                          Require Email Verification
                        </span>
                        <p className="text-xs text-gray-500">New users must verify their email address</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-labelledby="requireEmailVerificationLabel">
                        <input
                          type="checkbox"
                          checked={settings.requireEmailVerification}
                          onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span id="moderationEnabledLabel" className="text-sm font-medium text-gray-700">
                          Enable Content Moderation
                        </span>
                        <p className="text-xs text-gray-500">Automatically flag inappropriate content</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-labelledby="moderationEnabledLabel">
                        <input
                          type="checkbox"
                          checked={settings.moderationEnabled}
                          onChange={(e) => handleSettingChange('moderationEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rate Limits Tab */}
            {activeTab === 'limits' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Limits</h3>
                  
                  <div className="grid gap-6">
                    <div>
                      <label htmlFor="maxQuestionsPerDay" className="block text-sm font-medium text-gray-700 mb-2">
                        Max Questions Per Day (Per User)
                      </label>
                      <input
                        id="maxQuestionsPerDay"
                        type="number"
                        min={1}
                        max={100}
                        aria-describedby="maxQuestionsHelp"
                        value={settings.maxQuestionsPerDay}
                        onChange={(e) => handleSettingChange('maxQuestionsPerDay', Number.parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Limit how many questions a user can post per day</p>
                    </div>

                    <div>
                      <label htmlFor="maxArticlesPerDay" className="block text-sm font-medium text-gray-700 mb-2">
                        Max Articles Per Day (Per User)
                      </label>
                      <input
                        id="maxArticlesPerDay"
                        type="number"
                        min={1}
                        max={50}
                        aria-describedby="maxArticlesHelp"
                        value={settings.maxArticlesPerDay}
                        onChange={(e) => handleSettingChange('maxArticlesPerDay', Number.parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Limit how many articles a user can publish per day</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Mode</h3>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        <strong>Warning:</strong> Enabling maintenance mode will make the platform unavailable to regular users. Only administrators will be able to access the system.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <span id="maintenanceModeLabel" className="text-sm font-medium text-gray-700">
                        Enable Maintenance Mode
                      </span>
                      <p className="text-xs text-gray-500">Temporarily disable access for regular users</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer" aria-labelledby="maintenanceModeLabel">
                      <input
                        type="checkbox"
                        checked={settings.maintenanceMode}
                        onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                    </label>
                  </div>

                  {settings.maintenanceMode && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <p className="text-sm text-red-800">
                          <strong>Maintenance Mode is Active!</strong> Regular users cannot access the platform. Remember to disable this when maintenance is complete.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Database Status</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">API Status</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Online</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Active Sessions</span>
              </div>
              <span className="text-sm text-gray-900 font-medium">12</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
