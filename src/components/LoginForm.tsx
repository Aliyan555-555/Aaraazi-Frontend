import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Building2, Users } from 'lucide-react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = onLogin(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  const demoLogins = [
    { email: 'admin@agency.com', password: 'admin', role: 'Admin', name: 'Sarah Johnson' },
    { email: 'agent1@agency.com', password: 'agent1', role: 'Agent', name: 'Mike Chen' },
    { email: 'agent2@agency.com', password: 'agent2', role: 'Agent', name: 'Emily Rodriguez' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">aaraazi</span>
          </div>
          <p className="text-gray-600">Real Estate Management Platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>

            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDemo(!showDemo)}
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                Demo Accounts
              </Button>

              {showDemo && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600 mb-3">Click to login with demo accounts:</p>
                  {demoLogins.map((demo, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{demo.name}</p>
                          <p className="text-xs text-gray-500">{demo.role} • {demo.email}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEmail(demo.email);
                            setPassword(demo.password);
                            onLogin(demo.email, demo.password);
                          }}
                        >
                          Login
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};