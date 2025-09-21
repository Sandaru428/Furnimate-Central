import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoginView } from './login-view';

async function getCompanyName() {
  try {
    const profileDocRef = doc(db, 'companyProfile', 'main');
    const profileDocSnap = await getDoc(profileDocRef);
    if (profileDocSnap.exists()) {
      return profileDocSnap.data().companyName || 'Furnimate Central';
    }
  } catch (error) {
    console.error("Could not fetch company name for login page:", error);
  }
  // Return default name if fetch fails or doc doesn't exist
  return 'Furnimate Central';
}


export default async function LoginPage() {
  const companyName = await getCompanyName();
  
  return <LoginView companyName={companyName} />;
}
