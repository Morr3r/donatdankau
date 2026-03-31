"use client";

import { useState, type FormEvent } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import { type RegisterInput, validatePasswordValue, validateRegisterInput, validateUsernameValue } from "@/lib/validation/auth";

type RegisterFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function RegisterForm({ action }: RegisterFormProps) {
  const [values, setValues] = useState<RegisterInput>({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterInput, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function validateNameValue(name: string) {
    const normalized = name.trim().replace(/\s+/g, " ");
    const nameRegex = /^[A-Za-z\s'.-]+$/;

    if (!normalized) {
      return "Nama wajib diisi.";
    }
    if (normalized.length < 3) {
      return "Nama minimal 3 karakter.";
    }
    if (normalized.length > 80) {
      return "Nama maksimal 80 karakter.";
    }
    if (!nameRegex.test(normalized)) {
      return "Nama hanya boleh huruf, spasi, titik, petik, atau strip.";
    }
    return undefined;
  }

  function validateConfirmPasswordValue(password: string, confirmPassword: string) {
    if (!confirmPassword) {
      return "Konfirmasi password wajib diisi.";
    }
    if (password !== confirmPassword) {
      return "Konfirmasi password tidak sama.";
    }
    return undefined;
  }

  function handleFieldChange(field: keyof RegisterInput, value: string) {
    setValues((previous) => {
      const nextValues = {
        ...previous,
        [field]: value,
      };

      setErrors((previousErrors) => {
        const nextErrors: Partial<Record<keyof RegisterInput, string>> = { ...previousErrors };

        if (field === "name") {
          nextErrors.name = validateNameValue(value);
        }

        if (field === "username") {
          nextErrors.username = validateUsernameValue(value) ?? undefined;
        }

        if (field === "password") {
          nextErrors.password = validatePasswordValue(value) ?? undefined;
          if (touched.confirmPassword || nextValues.confirmPassword.length > 0) {
            nextErrors.confirmPassword = validateConfirmPasswordValue(value, nextValues.confirmPassword);
          }
        }

        if (field === "confirmPassword") {
          nextErrors.confirmPassword = validateConfirmPasswordValue(nextValues.password, value);
        }

        return nextErrors;
      });

      return nextValues;
    });

    setTouched((previous) => ({
      ...previous,
      [field]: true,
    }));
    setIsSubmitting(false);
  }

  function handleFieldBlur(field: keyof RegisterInput) {
    setTouched((previous) => ({
      ...previous,
      [field]: true,
    }));

    setErrors((previous) => {
      const nextErrors: Partial<Record<keyof RegisterInput, string>> = { ...previous };

      if (field === "name") {
        nextErrors.name = validateNameValue(values.name);
      }

      if (field === "username") {
        nextErrors.username = validateUsernameValue(values.username) ?? undefined;
      }

      if (field === "password") {
        nextErrors.password = validatePasswordValue(values.password) ?? undefined;
      }

      if (field === "confirmPassword" || field === "password") {
        nextErrors.confirmPassword = validateConfirmPasswordValue(values.password, values.confirmPassword);
      }

      return nextErrors;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const validated = validateRegisterInput(values);

    if (!validated.ok) {
      event.preventDefault();
      setErrors(validated.errors);
      setTouched({
        name: true,
        username: true,
        password: true,
        confirmPassword: true,
      });
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
  }

  return (
    <form action={action} noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#875f40]">
            Nama Admin
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={values.name}
            onChange={(event) => handleFieldChange("name", event.target.value)}
            onBlur={() => handleFieldBlur("name")}
            placeholder="Nama lengkap"
            autoComplete="name"
            aria-invalid={Boolean(touched.name && errors.name)}
            className="h-12 w-full rounded-xl border border-[#d8b88b] bg-[#fff9f0] px-4 text-sm text-[#472b1c] shadow-[0_6px_14px_-12px_rgba(71,43,28,0.5)] outline-none transition placeholder:text-[#9e7757] focus:border-[#d89f48] focus:bg-white focus:ring-2 focus:ring-[#f3d39c]"
          />
          {touched.name && errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
        </div>
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
            onBlur={() => handleFieldBlur("username")}
            placeholder="Masukkan Username Baru"
            autoComplete="username"
            aria-invalid={Boolean(touched.username && errors.username)}
            className="h-12 w-full rounded-xl border border-[#d8b88b] bg-[#fff9f0] px-4 text-sm text-[#472b1c] shadow-[0_6px_14px_-12px_rgba(71,43,28,0.5)] outline-none transition placeholder:text-[#9e7757] focus:border-[#d89f48] focus:bg-white focus:ring-2 focus:ring-[#f3d39c]"
          />
          {touched.username && errors.username ? <p className="mt-1 text-xs text-red-600">{errors.username}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              onBlur={() => handleFieldBlur("password")}
              placeholder="Buat Password"
              autoComplete="new-password"
              aria-invalid={Boolean(touched.password && errors.password)}
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
          {touched.password && errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password}</p> : null}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#875f40]">
            Konfirmasi Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={values.confirmPassword}
              onChange={(event) => handleFieldChange("confirmPassword", event.target.value)}
              onBlur={() => handleFieldBlur("confirmPassword")}
              placeholder="Ulangi password"
              autoComplete="new-password"
              aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
              className="h-12 w-full rounded-xl border border-[#d8b88b] bg-[#fff9f0] px-4 pr-12 text-sm text-[#472b1c] shadow-[0_6px_14px_-12px_rgba(71,43,28,0.5)] outline-none transition placeholder:text-[#9e7757] focus:border-[#d89f48] focus:bg-white focus:ring-2 focus:ring-[#f3d39c]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((previous) => !previous)}
              aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-[#e7cfaa] bg-[#fff3df] text-[#7a573e] transition hover:bg-[#ffe9c8] hover:text-[#4b2f1f]"
            >
              {showConfirmPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
            </button>
          </div>
          {touched.confirmPassword && errors.confirmPassword ? (
            <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-xl border border-[#c7882f] bg-[#f0b24d] text-sm font-semibold text-[#3d2418] shadow-[0_14px_28px_-18px_rgba(125,73,30,0.45)] transition hover:bg-[#e8a53a] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Memproses..." : "Buat Akun Admin"}
      </button>
    </form>
  );
}
