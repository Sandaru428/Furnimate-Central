'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/icons/logo";

export default function AuthActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<string | null>(null);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('Furnimate Central');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string>('');

  const loginBg = PlaceHolderImages.find(p => p.id === "login-background");
  const passwordsMatch = newPassword === confirmPassword && newPassword.length >= 6 && confirmPassword.length >= 6;

  useEffect(() => {
    // Fetch company name
    const fetchCompanyName = async () => {
      try {
        const profileDocRef = doc(db, 'companyProfile', 'main');
        const profileDocSnap = await getDoc(profileDocRef);
        if (profileDocSnap.exists()) {
          setCompanyName(profileDocSnap.data().companyName || 'Furnimate Central');
        }
      } catch (error) {
        console.error("Could not fetch company name:", error);
      }
    };
    fetchCompanyName();

    const modeParam = searchParams.get('mode');
    const codeParam = searchParams.get('oobCode');
    
    setMode(modeParam);
    setOobCode(codeParam);

    // Verify the code is valid
    if (modeParam === 'resetPassword' && codeParam) {
      verifyPasswordResetCode(auth, codeParam)
        .then((email) => {
          setEmail(email);
          setVerifying(false);
        })
        .catch((error) => {
          setError('Invalid or expired password reset link.');
          setVerifying(false);
        });
    } else {
      setError('Invalid request.');
      setVerifying(false);
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
      });
      return;
    }

    if (!oobCode) return;

    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been updated. You can now log in with your new password.',
      });

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to reset password.',
      });
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Verifying...</CardTitle>
              <CardDescription>Please wait while we verify your reset link.</CardDescription>
            </CardHeader>
          </Card>
        </div>
        <div className="hidden bg-muted lg:block relative">
          {loginBg && (
            <Image
              src={loginBg.imageUrl}
              alt={loginBg.description}
              data-ai-hint={loginBg.imageHint}
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
          <div className="relative h-full flex flex-col justify-between p-10 text-white">
            <div className="flex items-center gap-4 text-lg font-medium">
              <Logo />
              <span className="font-headline text-2xl">{companyName}</span>
            </div>
            <div className="mt-auto">
              <blockquote className="space-y-2">
                <p className="text-lg">
                  &ldquo;This platform has revolutionized our workflow, bringing clarity and efficiency to every stage of our process, from procurement to delivery.&rdquo;
                </p>
                <footer className="text-sm">Sofia Davis, Production Manager</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-destructive">Invalid Link</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/login')} className="w-full">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="hidden bg-muted lg:block relative">
          {loginBg && (
            <Image
              src={loginBg.imageUrl}
              alt={loginBg.description}
              data-ai-hint={loginBg.imageHint}
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
          <div className="relative h-full flex flex-col justify-between p-10 text-white">
            <div className="flex items-center gap-4 text-lg font-medium">
              <Logo />
              <span className="font-headline text-2xl">{companyName}</span>
            </div>
            <div className="mt-auto">
              <blockquote className="space-y-2">
                <p className="text-lg">
                  &ldquo;This platform has revolutionized our workflow, bringing clarity and efficiency to every stage of our process, from procurement to delivery.&rdquo;
                </p>
                <footer className="text-sm">Sofia Davis, Production Manager</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Reset Password</CardTitle>
            <CardDescription>
              Enter a new password for {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
                {newPassword && newPassword.length < 6 && (
                  <p className="text-sm text-destructive">Password must be at least 6 characters</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
                {confirmPassword && confirmPassword.length < 6 && (
                  <p className="text-sm text-destructive">Password must be at least 6 characters</p>
                )}
                {newPassword && confirmPassword && newPassword.length >= 6 && confirmPassword.length >= 6 && !passwordsMatch && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading || !passwordsMatch}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push('/login')}
                disabled={loading}
              >
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="hidden bg-muted lg:block relative">
        {loginBg && (
          <Image
            src={loginBg.imageUrl}
            alt={loginBg.description}
            data-ai-hint={loginBg.imageHint}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
        <div className="relative h-full flex flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-4 text-lg font-medium">
            <Logo />
            <span className="font-headline text-2xl">{companyName}</span>
          </div>
          <div className="mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;This platform has revolutionized our workflow, bringing clarity and efficiency to every stage of our process, from procurement to delivery.&rdquo;
              </p>
              <footer className="text-sm">Sofia Davis, Production Manager</footer>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
