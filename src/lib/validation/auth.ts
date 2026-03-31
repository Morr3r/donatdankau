export type LoginInput = {
  username: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
};

type ValidationErrorMap<T extends Record<string, unknown>> = Partial<Record<keyof T, string>>;

type ValidationSuccess<T> = {
  ok: true;
  data: T;
};

type ValidationFailure<T extends Record<string, unknown>> = {
  ok: false;
  errors: ValidationErrorMap<T>;
  message: string;
};

export type ValidationResult<T extends Record<string, unknown>> = ValidationSuccess<T> | ValidationFailure<T>;

const NAME_REGEX = /^[A-Za-z\s'.-]+$/;
const USERNAME_REGEX = /^[a-z0-9]+$/;
const MIN_PASSWORD_LENGTH = 6;

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function firstError<T extends Record<string, unknown>>(errors: ValidationErrorMap<T>, fallback: string) {
  return Object.values(errors).find((value) => Boolean(value)) ?? fallback;
}

export function validateUsernameValue(username: string) {
  const normalized = normalizeWhitespace(username).toLowerCase();

  if (!normalized) {
    return "Username wajib diisi.";
  }
  if (normalized.length < 3) {
    return "Username minimal 3 karakter.";
  }
  if (normalized.length > 30) {
    return "Username maksimal 30 karakter.";
  }
  if (!USERNAME_REGEX.test(normalized)) {
    return "Username hanya boleh huruf dan angka tanpa spasi/simbol.";
  }

  return null;
}

export function validatePasswordValue(password: string) {
  if (!password) {
    return "Password wajib diisi.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }
  if (password.length > 72) {
    return "Password maksimal 72 karakter.";
  }

  return null;
}

export function validateLoginInput(input: LoginInput): ValidationResult<LoginInput> {
  const normalized: LoginInput = {
    username: normalizeWhitespace(input.username).toLowerCase(),
    password: input.password,
  };

  const errors: ValidationErrorMap<LoginInput> = {};

  const usernameError = validateUsernameValue(normalized.username);
  if (usernameError) errors.username = usernameError;

  const passwordError = validatePasswordValue(normalized.password);
  if (passwordError) errors.password = passwordError;

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      message: firstError(errors, "Input login tidak valid."),
    };
  }

  return { ok: true, data: normalized };
}

export function validateRegisterInput(input: RegisterInput): ValidationResult<RegisterInput> {
  const normalized: RegisterInput = {
    name: normalizeWhitespace(input.name),
    username: normalizeWhitespace(input.username).toLowerCase(),
    password: input.password,
    confirmPassword: input.confirmPassword,
  };

  const errors: ValidationErrorMap<RegisterInput> = {};

  if (!normalized.name) {
    errors.name = "Nama wajib diisi.";
  } else if (normalized.name.length < 3) {
    errors.name = "Nama minimal 3 karakter.";
  } else if (normalized.name.length > 80) {
    errors.name = "Nama maksimal 80 karakter.";
  } else if (!NAME_REGEX.test(normalized.name)) {
    errors.name = "Nama hanya boleh huruf, spasi, titik, petik, atau strip.";
  }

  const usernameError = validateUsernameValue(normalized.username);
  if (usernameError) errors.username = usernameError;

  const passwordError = validatePasswordValue(normalized.password);
  if (passwordError) errors.password = passwordError;

  if (!normalized.confirmPassword) {
    errors.confirmPassword = "Konfirmasi password wajib diisi.";
  } else if (normalized.password !== normalized.confirmPassword) {
    errors.confirmPassword = "Konfirmasi password tidak sama.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      message: firstError(errors, "Input registrasi tidak valid."),
    };
  }

  return { ok: true, data: normalized };
}
