import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Shield, 
  Key, 
  Lock, 
  Smartphone, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Monitor,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  changePassword, 
  validatePasswordStrength,
  getSecurityLogs,
  calculateSecurityScore,
  enable2FA,
  disable2FA
} from '../../lib/security';
import { getUserSettings, updateUserSettings } from '../../lib/userSettings';

interface SecuritySettingsProps {
  user: User;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ user }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [securityScore, setSecurityScore] = useState({ score: 0, recommendations: [] as string[] });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    loadSecurityData();
  }, [user.id]);

  const loadSecurityData = () => {
    const score = calculateSecurityScore(user.id);
    setSecurityScore(score);
    
    const logs = getSecurityLogs(user.id).slice(-5);
    setRecentLogs(logs);
    
    const userSettings = getUserSettings(user.id);
    setSettings(userSettings);
  };

  useEffect(() => {
    if (newPassword) {
      const validation = validatePasswordStrength(newPassword);
      setPasswordStrength(validation.strength);
    }
  }, [newPassword]);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const result = changePassword(user.id, currentPassword, newPassword);
    
    if (result.success) {
      toast.success(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      loadSecurityData();
    } else {
      toast.error(result.message);
    }
  };

  const handleEnable2FA = () => {
    const { secret, qrCode: qr } = enable2FA(user.id);
    setQrCode(qr);
    setShow2FASetup(true);
  };

  const handleConfirm2FA = () => {
    if (settings) {
      updateUserSettings(user.id, {
        security: {
          ...settings.security,
          twoFactorEnabled: true,
        },
      });
      toast.success('Two-factor authentication enabled');
      setShow2FASetup(false);
      loadSecurityData();
    }
  };

  const handleDisable2FA = () => {
    if (settings) {
      disable2FA(user.id);
      updateUserSettings(user.id, {
        security: {
          ...settings.security,
          twoFactorEnabled: false,
        },
      });
      toast.success('Two-factor authentication disabled');
      loadSecurityData();
    }
  };

  const handleUpdateSessionTimeout = (timeout: number) => {
    if (settings) {
      updateUserSettings(user.id, {
        security: {
          ...settings.security,
          sessionTimeout: timeout,
        },
      });
      toast.success('Session timeout updated');
      loadSecurityData();
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 50) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl text-gray-900 mb-2">Security Score</h2>
              <p className="text-gray-600 mb-4">
                Your account security is {getScoreLabel(securityScore.score).toLowerCase()}
              </p>
              {securityScore.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Recommendations:</p>
                  <ul className="space-y-1">
                    {securityScore.recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(securityScore.score)}`}>
              {securityScore.score}
            </div>
            <p className="text-sm text-gray-600">out of 100</p>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl text-gray-900">Change Password</h2>
        </div>
        <p className="text-gray-600 mb-6">Ensure your password is strong and unique</p>

        <div className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        passwordStrength === 'strong' ? 'bg-green-500 w-full' :
                        passwordStrength === 'medium' ? 'bg-yellow-500 w-2/3' :
                        'bg-red-500 w-1/3'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength === 'strong' ? 'text-green-600' :
                    passwordStrength === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Use 8+ characters with uppercase, lowercase, numbers, and symbols
                </p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <Button 
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword}
            className="w-full"
          >
            <Lock className="h-4 w-4 mr-2" />
            Change Password
          </Button>
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl text-gray-900">Two-Factor Authentication</h2>
        </div>
        <p className="text-gray-600 mb-6">Add an extra layer of security to your account</p>

        {!show2FASetup ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.security.twoFactorEnabled ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">2FA is Enabled</p>
                    <p className="text-sm text-gray-600">Your account is protected with 2FA</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">2FA is Disabled</p>
                    <p className="text-sm text-gray-600">Enable 2FA for enhanced security</p>
                  </div>
                </>
              )}
            </div>
            {settings.security.twoFactorEnabled ? (
              <Button variant="outline" onClick={handleDisable2FA}>
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={handleEnable2FA}>
                Enable 2FA
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4">Set up Two-Factor Authentication</h3>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Scan this QR code with your authenticator app
                </p>
                <p className="text-xs text-gray-500">
                  Google Authenticator, Authy, or Microsoft Authenticator
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShow2FASetup(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleConfirm2FA} className="flex-1">
                  Verify & Enable
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Session Management */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl text-gray-900">Session Management</h2>
        </div>
        <p className="text-gray-600 mb-6">Control your active sessions and timeout settings</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="sessionTimeout">Session Timeout</Label>
            <select
              id="sessionTimeout"
              value={settings.security.sessionTimeout}
              onChange={(e) => handleUpdateSessionTimeout(parseInt(e.target.value))}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="480">8 hours</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Automatically log out after this period of inactivity
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label className="mb-0">Login Alerts</Label>
              <p className="text-xs text-gray-500">Get notified of new login attempts</p>
            </div>
            <input
              type="checkbox"
              checked={settings.security.loginAlerts}
              onChange={(e) => {
                updateUserSettings(user.id, {
                  security: {
                    ...settings.security,
                    loginAlerts: e.target.checked,
                  },
                });
                loadSecurityData();
              }}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Recent Security Activity */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl text-gray-900">Recent Activity</h2>
        </div>
        <p className="text-gray-600 mb-6">Monitor recent security-related activities</p>

        {recentLogs.length > 0 ? (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Monitor className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{log.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
                <Badge variant={
                  log.severity === 'critical' ? 'destructive' :
                  log.severity === 'warning' ? 'default' :
                  'outline'
                }>
                  {log.severity}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">No recent activity</p>
        )}
      </Card>
    </div>
  );
};
