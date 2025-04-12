'use client'

import Navbar from '../../../components/Navbar';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/app/utils/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Home () {
    <Navbar />;
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [verificationMessage, setVerificationMessage] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {

            if (authUser) {
                if (authUser.emailVerified) {
                    const userDoc = await getDoc(doc(db, "users", authUser.uid));
                    if (!userDoc.exists()) {
                        const registrationData = localStorage.getItem("registrationData");
                        const {
                            firstName = "",
                            lastName = "",
                        } = registrationData ? JSON.parse(registrationData) : {};

                        await setDoc(doc(db, "users", authUser.uid), {
                            firstName,
                            lastName,
                            email: authUser.email,
                        });
                        localStorage.removeItem("registrationData");
                    }
                    setUser(authUser);
                } else {
                    setUser(null);
                    setVerificationMessage("Your email address is not yet verified. Please check your inbox (and spam folder) for the verification link.");
                }
            } else {
                setUser(null);
                router.push("/auth/login");
            }
        });

        return () => unsubscribe();
    }, [router]);

    return (
        <div className="text-5xl font-bold text-[var(--light-yellow)] bg-[var(--dark-green)]">
            <h1>Welcome to AncesTREE!</h1>
            {verificationMessage && <p className="text-[var(--light-yellow)]">{verificationMessage}</p>}
            {user && user.emailVerified && (
                <div>
                    
                </div>
            )}
        </div>
    );
};