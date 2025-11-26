
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
import { authProfileAtom, companyProfileAtom, currencyAtom, type AuthProfile, type CompanyProfile } from "@/lib/store";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { currencies } from "@/lib/currencies";

type AuthContextType = {
  user: User | null;
  authProfile: AuthProfile | null;
  loading: boolean;
  handleSignIn: (email: string, pass: string) => Promise<boolean>;
  handlePasswordReset: (email: string) => Promise<void>;
  handleSignOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authProfile, setAuthProfile] = useAtom(authProfileAtom);
  const [, setCompanyProfile] = useAtom(companyProfileAtom);
  const [, setCurrency] = useAtom(currencyAtom);
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
            const userDocData = querySnapshot.docs[0].data() as Omit<AuthProfile, 'id'>;
            const userDocId = querySnapshot.docs[0].id;
            const userDoc = { 
              ...userDocData, 
              id: userDocId,
              companyId: userDocData.companyId || 'main' // Default to 'main' if not set
            };
            
            // Fetch the role to get the latest access options
            const rolesQuery = query(collection(db, "userRoles"), where("name", "==", userDoc.role));
            const roleSnapshot = await getDocs(rolesQuery);

            if (!roleSnapshot.empty) {
                const roleDoc = roleSnapshot.docs[0].data();
                userDoc.accessOptions = roleDoc.accessOptions;
            }
            
            setAuthProfile(userDoc);
            
            // Now fetch the company profile 
            const profileDocRef = doc(db, "companyProfile", 'main');
            const profileDocSnap = await getDoc(profileDocRef);
            
            if (profileDocSnap.exists()) {
              const companyProfileData = profileDocSnap.data() as CompanyProfile;
              setCompanyProfile(companyProfileData);
              const newCurrency = currencies.find(c => c.code === companyProfileData.currency);
              if (newCurrency) {
                setCurrency(newCurrency);
              }
            }
            setUser(user);

        } else {
            // User exists in Firebase Auth but not in our 'users' collection
            setUser(user);
            setAuthProfile(null);
            toast({
                variant: 'destructive',
                title: 'Authorization Error',
                description: 'Your user profile could not be found in the company database.'
            });
        }
      } else {
        setUser(null);
        setAuthProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setAuthProfile, setCompanyProfile, setCurrency, toast]);

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

  const handlePasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset Email Sent",
        description: `If an account exists for ${email}, a password reset link has been sent.`,
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
    <AuthContext.Provider value={{ user, authProfile, loading, handleSignIn, handlePasswordReset, handleSignOut }}>
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
