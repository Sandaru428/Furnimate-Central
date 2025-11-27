
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { Eye, EyeOff } from 'lucide-react';

const loginFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password cannot be empty.",
  }),
});

const forgotPasswordSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
});

export function LoginForm() {
  const router = useRouter();
  const { handleSignIn, handlePasswordReset } = useAuth();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onLoginSubmit(values: z.infer<typeof loginFormSchema>) {
    const success = await handleSignIn(values.email, values.password);
    if (success) {
      router.push("/dashboard");
    }
  }

  async function onForgotPasswordSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    await handlePasswordReset(values.email);
    forgotPasswordForm.reset();
    setIsResetDialogOpen(false);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Log In</CardTitle>
        <CardDescription>
          Enter your email below to log in to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel>Password</FormLabel>
                    <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="link" type="button" className="ml-auto inline-block text-sm underline">
                                Forgot your password?
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <Form {...forgotPasswordForm}>
                                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Reset Your Password</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Enter your email address and we will send you a link to reset your password.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="py-4">
                                        <FormField
                                            control={forgotPasswordForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="name@example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                                        <AlertDialogAction type="submit">Submit</AlertDialogAction>
                                    </AlertDialogFooter>
                                </form>
                            </Form>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} className="pr-10" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Log In
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
