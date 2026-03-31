"use client";

import { useState, type FormEvent } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import { validateLoginInput, type LoginInput } from "@/lib/validation/auth";

type LoginFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function LoginForm({ action }: LoginFormProps) {
  const [values, setValues] = useState<LoginInput>({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleFieldChange(field: keyof LoginInput, value: string) {
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));
    setIsSubmitting(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const validated = validateLoginInput(values);

    if (!validated.ok) {
      event.preventDefault();
      setErrors(validated.errors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
  }

  return (
    <form action={action} noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="username" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#875f40]">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={values.username}
          onChange={(event) => handleFieldChange("username", event.target.value)}
          placeholder="Masukkan username"
          autoComplete="username"
          aria-invalid={Boolean(errors.username)}
          className="h-12 w-full rounded-xl border border-[#d8b88b] bg-[#fff9f0] px-4 text-sm text-[#472b1c] shadow-[0_6px_14px_-12px_rgba(71,43,28,0.5)] outline-none transition placeholder:text-[#9e7757] focus:border-[#d89f48] focus:bg-white focus:ring-2 focus:ring-[#f3d39c]"
        />
        {errors.username ? <p className="mt-1 text-xs text-red-600">{errors.username}</p> : null}
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#875f40]">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={(event) => handleFieldChange("password", event.target.value)}
            placeholder="Masukkan password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            className="h-12 w-full rounded-xl border border-[#d8b88b] bg-[#fff9f0] px-4 pr-12 text-sm text-[#472b1c] shadow-[0_6px_14px_-12px_rgba(71,43,28,0.5)] outline-none transition placeholder:text-[#9e7757] focus:border-[#d89f48] focus:bg-white focus:ring-2 focus:ring-[#f3d39c]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((previous) => !previous)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-[#e7cfaa] bg-[#fff3df] text-[#7a573e] transition hover:bg-[#ffe9c8] hover:text-[#4b2f1f]"
          >
            {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-xl border border-[#c7882f] bg-[#f0b24d] text-sm font-semibold text-[#3d2418] shadow-[0_14px_28px_-18px_rgba(125,73,30,0.45)] transition hover:bg-[#e8a53a] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Memproses..." : "Masuk Dashboard"}
      </button>
    </form>
  );
}
