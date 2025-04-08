import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Welcome to AncesTree Website!</h1>
      <p>This is the homepage of our application. I'm still testing</p>
      <Link href="/auth/login">Go to Login</Link>
      <br />
      <Link href="/auth/signup">Go to Signup</Link>
    </div>
  );
}
