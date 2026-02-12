'use client';

import React, { useState, useMemo } from 'react';
import type { User } from '@/types';
import type { UserSettings } from '@/types/settings.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

interface SecuritySettingsProps {
  user: User;
  settings: UserSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<UserSettings>>;
}

function validatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (!password) return 'weak';
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

function getSecurityScoreFromSettings(settings: UserSettings): { score: number; recommendations: string[] } {
  const recs: string[] = [];
  let score = 50;
  if (settings.security.twoFactorEnabled) score += 25;
  else recs.push('Enable two-factor authentication');
  if (settings.security.sessionTimeout >= 60) score += 10;
  else recs.push('Use at least 60 minutes session timeout');
  if (settings.security.loginAlerts) score += 15;
  else recs.push('Enable login alerts');
  return { score: Math.min(100, score), recommendations: recs };
}

export function SecuritySettings({ user, settings, onSettingsChange }: SecuritySettingsProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);

  const passwordStrength = useMemo(
    () => validatePasswordStrength(newPassword),
    [newPassword]
  );
  const securityScore = useMemo(
    () => getSecurityScoreFromSettings(settings),
    [settings.security.twoFactorEnabled, settings.security.sessionTimeout, settings.security.loginAlerts]
  );

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordStrength === 'weak') {
      toast.error('Please choose a stronger password');
      return;
    }
    toast.info('Use Forgot password on the login page or contact your administrator to change your password.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleEnable2FA = () => setShow2FASetup(true);
  const handleConfirm2FA = () => {
    onSettingsChange((prev) => ({
      ...prev,
      security: { ...prev.security, twoFactorEnabled: true },
    }));
    toast.success('Two-factor authentication enabled');
    setShow2FASetup(false);
  };
  const handleDisable2FA = () => {
    onSettingsChange((prev) => ({
      ...prev,
      security: { ...prev.security, twoFactorEnabled: false },
    }));
    toast.success('Two-factor authentication disabled');
  };

  const handleSessionTimeout = (timeout: number) => {
    onSettingsChange((prev) => ({
      ...prev,
      security: { ...prev.security, sessionTimeout: timeout },
    }));
    toast.success('Session timeout updated');
  };

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
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-card p-3 shadow-sm">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="mb-2 text-xl font-semibold">Security Score</h2>
              <p className="mb-4 text-muted-foreground">
                Your account security is {getScoreLabel(securityScore.score).toLowerCase()}.
              </p>
              {securityScore.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recommendations:</p>
                  <ul className="space-y-1">
                    {securityScore.recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
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
            <p className="text-sm text-muted-foreground">out of 100</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Change Password</h2>
        </div>
        <p className="mb-6 text-muted-foreground">Ensure your password is strong and unique.</p>
        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2">
                <div className="mb-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength === 'strong'
                          ? 'w-full bg-green-500'
                          : passwordStrength === 'medium'
                            ? 'w-2/3 bg-amber-500'
                            : 'w-1/3 bg-red-500'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength === 'strong'
                        ? 'text-green-600'
                        : passwordStrength === 'medium'
                          ? 'text-amber-600'
                          : 'text-red-600'
                    }`}
                  >
                    {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use 8+ characters with uppercase, lowercase, numbers, and symbols
                </p>
              </div>
            )}
          </div>
          <div className="space-y-2">
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
            <Lock className="mr-2 h-4 w-4" />
            Change Password
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
        </div>
        <p className="mb-6 text-muted-foreground">Add an extra layer of security to your account.</p>
        {!show2FASetup ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.security.twoFactorEnabled ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">2FA is Enabled</p>
                    <p className="text-sm text-muted-foreground">Your account is protected with 2FA</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">2FA is Disabled</p>
                    <p className="text-sm text-muted-foreground">Enable 2FA for enhanced security</p>
                  </div>
                </>
              )}
            </div>
            {settings.security.twoFactorEnabled ? (
              <Button variant="outline" onClick={handleDisable2FA}>
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={handleEnable2FA}>Enable 2FA</Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-6">
            <h3 className="mb-4 font-medium">Set up Two-Factor Authentication</h3>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="flex h-48 w-48 items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground">
                  QR code placeholder — connect authenticator app when backend is ready
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Scan the QR code with Google Authenticator, Authy, or Microsoft Authenticator.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShow2FASetup(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleConfirm2FA}>
                  Verify & Enable
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Session Management</h2>
        </div>
        <p className="mb-6 text-muted-foreground">Control your active sessions and timeout settings.</p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Session Timeout</Label>
            <Select
              value={String(settings.security.sessionTimeout)}
              onValueChange={(v) => handleSessionTimeout(parseInt(v, 10))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Automatically log out after this period of inactivity
            </p>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <Label className="font-normal">Login Alerts</Label>
              <p className="text-xs text-muted-foreground">Get notified of new login attempts</p>
            </div>
            <Checkbox
              checked={settings.security.loginAlerts}
              onCheckedChange={(checked) =>
                onSettingsChange((prev) => ({
                  ...prev,
                  security: { ...prev.security, loginAlerts: checked === true },
                }))
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Recent Activity</h2>
        </div>
        <p className="mb-6 text-muted-foreground">Monitor recent security-related activities.</p>
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
          <Monitor className="h-10 w-10" />
          <p>No recent activity</p>
        </div>
      </Card>
    </div>
  );
}
