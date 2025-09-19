
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User, sendPasswordResetEmail, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useToast } from "./use-toast";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { authProfileAtom, type AuthProfile } from "@/lib/store";
import { collection, query, where, getDocs } from "firebase/firestore";

type AuthContextType = {
  user: User | null;
  authProfile: AuthProfile | null;
  loading: boolean;
  handleSignIn: (email: string, pass: string) => Promise<boolean>;
  handleSignUp: (email: string, pass: string) => Promise<boolean>;
  handlePasswordReset: () => Promise<void>;
  handleSignOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authProfile, setAuthProfile] = useAtom(authProfileAtom);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        // Fetch user profile from Firestore
        const q = query(collection(db, "users"), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0].data() as AuthProfile;

            const rolesQuery = query(collection(db, "userRoles"), where("companyId", "==", userDoc.companyId), where("name", "==", userDoc.role));
            const roleSnapshot = await getDocs(rolesQuery);

            if (!roleSnapshot.empty) {
                const roleDoc = roleSnapshot.docs[0].data();
                userDoc.accessOptions = roleDoc.accessOptions;
            }
            
            setUser(user);
            setAuthProfile(userDoc);
        } else {
            setUser(user); // Still set firebase user
            setAuthProfile(null);
        }
      } else {
        setUser(null);
        setAuthProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setAuthProfile]);

  const handleSignIn = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
      return false;
    }
  };
  
  const handleSignUp = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
       toast({
        title: "Account Created",
        description: "You have been successfully signed up.",
      });
      return true;
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Sign-up Failed",
        description: error.message,
      });
      return false;
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No email address found for your account.",
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: "Password Reset Email Sent",
        description: `An email has been sent to ${user.email} with instructions to reset your password.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Sending Reset Email",
        description: error.message,
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      setAuthProfile(null);
      router.push('/login');
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, authProfile, loading, handleSignIn, handleSignUp, handlePasswordReset, handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
