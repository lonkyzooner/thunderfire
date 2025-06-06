import React, { useState } from 'react';
import { useAuth } from '../../contexts/DevAuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onLoginClick }) => {
  const { login } = useAuth();
  const { error, handleError, clearError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [departmentId, setDepartmentId] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');

  const handleRegister = async () => {
    try {
      setIsLoading(true);
      clearError();
      
      // Store department ID and badge number in local storage
      // so we can use it after Auth0 redirects back
      localStorage.setItem('lark_registration_department_id', departmentId);
      localStorage.setItem('lark_registration_badge_number', badgeNumber);
      
      // Use Auth0 signup/login
      await login();
      
      // The rest of the registration process will be handled
      // after Auth0 redirects back to the application
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      handleError({
        message: `Registration failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        source: 'RegisterForm',
        recoverable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
        <CardDescription className="text-center">
          Enter your information to create your LARK account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm bg-red-100 border border-red-200 text-red-800 rounded-md">
            {error.message}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="departmentId">Department ID</Label>
          <Input 
            id="departmentId" 
            placeholder="Enter your department ID" 
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="badgeNumber">Badge Number</Label>
          <Input 
            id="badgeNumber" 
            placeholder="Enter your badge number" 
            value={badgeNumber}
            onChange={(e) => setBadgeNumber(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={handleRegister} 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            disabled={isLoading || !departmentId || !badgeNumber}
          >
            {isLoading ? 'Creating account...' : 'Continue with Auth0'}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            You'll be redirected to Auth0 to complete your registration
          </p>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" type="button" disabled={isLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub
          </Button>
          <Button variant="outline" type="button" disabled={isLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2" viewBox="0 0 16 16">
              <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
            </svg>
            Google
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center text-gray-500">
          Already have an account?{' '}
          <button
            onClick={onLoginClick}
            className="text-blue-600 hover:underline"
            disabled={isLoading}
          >
            Sign in
          </button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RegisterForm;
