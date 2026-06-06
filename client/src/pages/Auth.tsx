import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginCustomer, registerCustomer } from "../api";
import { Seo } from "../components/Seo";

interface AuthProps {
  mode: "Login" | "Register" | "Forgot Password";
}

export function Auth({ mode }: AuthProps) {
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Seo title={mode} description={`${mode} to Innova Creations`} />
      <form
        className="rounded bg-white p-6 shadow-gold border border-gold/15"
        onSubmit={async (e) => {
          e.preventDefault();
          if (mode === "Forgot Password") {
            toast.success("Password reset link sent");
            return;
          }
          const formData = new FormData(e.currentTarget);
          setSubmitting(true);
          try {
            const payload = {
              email: String(formData.get("email")),
              password: String(formData.get("password")),
              name: String(formData.get("name") || ""),
            };
            const user =
              mode === "Login"
                ? await loginCustomer(payload)
                : await registerCustomer(payload);
            localStorage.setItem("innova-user", JSON.stringify(user));
            toast.success(
              mode === "Login"
                ? "Signed in successfully"
                : "Account created successfully"
            );
            nav("/account");
          } catch (error: any) {
            toast.error(error?.response?.data?.message || "Unable to continue");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <h1 className="font-display text-5xl text-navy">{mode}</h1>
        {mode === "Register" && (
          <input
            required
            name="name"
            placeholder="Name"
            className="mt-4 w-full rounded border border-gold/30 px-3 py-2 focus:outline-gold"
          />
        )}
        <input
          required
          name="email"
          type="email"
          placeholder="Email"
          className="mt-4 w-full rounded border border-gold/30 px-3 py-2 focus:outline-gold"
        />
        {mode !== "Forgot Password" && (
          <input
            required
            minLength={8}
            name="password"
            type="password"
            placeholder="Password"
            className="mt-4 w-full rounded border border-gold/30 px-3 py-2 focus:outline-gold"
          />
        )}
        <button
          type="submit"
          disabled={submitting}
          className="gold-btn mt-5 w-full rounded py-3 disabled:opacity-60 font-semibold"
        >
          {submitting ? "Please wait..." : mode}
        </button>
        {mode === "Login" && (
          <Link to="/register" className="mt-4 block text-center text-gold-dark hover:underline">
            Create an account
          </Link>
        )}
        {mode !== "Login" && (
          <Link to="/login" className="mt-4 block text-center text-gold-dark hover:underline">
            Already have an account? Sign in
          </Link>
        )}
      </form>
    </main>
  );
}
