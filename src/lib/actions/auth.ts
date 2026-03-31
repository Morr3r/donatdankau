"use server";

import { hash, compare } from "bcryptjs";
import { PrismaClientInitializationError, PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession, createSessionForUser, requireAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { validateLoginInput, validateRegisterInput } from "@/lib/validation/auth";

function redirectWithStatus(path: string, key: "success" | "error", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function isRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

function getAuthActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "");
      if (target.includes("username") || target.includes("email")) {
        return "Username sudah dipakai.";
      }

      return "Data yang sama sudah terdaftar.";
    }

    if (["P1000", "P1001", "P1010"].includes(error.code)) {
      return "Koneksi database bermasalah. Periksa DATABASE_URL project lalu restart server.";
    }
  }

  if (error instanceof PrismaClientInitializationError) {
    return "Koneksi database gagal diinisialisasi. Periksa DATABASE_URL project lalu restart server.";
  }

  return fallback;
}

async function findUserByUsername(username: string) {
  return prisma.appUser.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
  });
}

export async function loginAction(formData: FormData) {
  const path = "/auth/login";
  try {
    const validated = validateLoginInput({
      username: normalizeText(formData.get("username")),
      password: String(formData.get("password") ?? ""),
    });

    if (!validated.ok) {
      redirectWithStatus(path, "error", validated.message);
    }

    const { username, password } = validated.data;
    const user = await findUserByUsername(username);

    if (!user || !user.passwordHash) {
      redirectWithStatus(path, "error", "Username atau password salah.");
    }

    if (user.status !== "ACTIVE" || user.role !== "ADMIN") {
      redirectWithStatus(path, "error", "Akun tidak aktif atau tidak punya akses admin.");
    }

    const validPassword = await compare(password, user.passwordHash);
    if (!validPassword) {
      redirectWithStatus(path, "error", "Username atau password salah.");
    }

    await prisma.$transaction([
      prisma.appUser.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
      prisma.authSession.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      }),
    ]);

    await createSessionForUser(user.id);
    revalidatePath("/");
    redirect("/dashboard?success=" + encodeURIComponent("Login berhasil. Selamat datang!") + "&tutorial=login");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("[loginAction]", error);
    redirectWithStatus(path, "error", getAuthActionErrorMessage(error, "Login gagal. Silakan coba lagi."));
  }
}

export async function registerAction(formData: FormData) {
  const path = "/auth/register";

  try {
    const validated = validateRegisterInput({
      name: normalizeText(formData.get("name")),
      username: normalizeText(formData.get("username")),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });

    if (!validated.ok) {
      redirectWithStatus(path, "error", validated.message);
    }

    const { name, username, password } = validated.data;
    const existing = await findUserByUsername(username);
    if (existing) {
      redirectWithStatus(path, "error", "Username sudah dipakai.");
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.appUser.create({
      data: {
        name,
        username,
        email: `${username}@donatdankau.local`,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        permissions: {
          canCreateMaster: true,
          canManageStock: true,
          canViewReports: true,
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        module: "AUTH",
        action: "REGISTER",
        entity: "AppUser",
        entityId: user.id,
        details: "Registrasi admin baru",
      },
    });

    await createSessionForUser(user.id);
    revalidatePath("/");
    redirect("/dashboard?success=" + encodeURIComponent("Registrasi berhasil dan akun langsung aktif.") + "&tutorial=register");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("[registerAction]", error);
    redirectWithStatus(path, "error", getAuthActionErrorMessage(error, "Registrasi gagal. Silakan coba lagi."));
  }
}

export async function createAdminRegistrationAction(formData: FormData) {
  const path = "/master/register";

  try {
    const actor = await requireAuthUser();

    const validated = validateRegisterInput({
      name: normalizeText(formData.get("name")),
      username: normalizeText(formData.get("username")),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });

    if (!validated.ok) {
      redirectWithStatus(path, "error", validated.message);
    }

    const { name, username, password } = validated.data;
    const existing = await findUserByUsername(username);
    if (existing) {
      redirectWithStatus(path, "error", "Username sudah dipakai.");
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.appUser.create({
      data: {
        name,
        username,
        email: `${username}@donatdankau.local`,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        permissions: {
          canCreateMaster: true,
          canManageStock: true,
          canViewReports: true,
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: actor.id,
        module: "MASTER_REGISTER",
        action: "CREATE_ADMIN",
        entity: "AppUser",
        entityId: user.id,
        details: `Mendaftarkan admin baru: ${user.username ?? user.name}`,
      },
    });

    revalidatePath(path);
    redirectWithStatus(path, "success", "Admin baru berhasil didaftarkan.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("[createAdminRegistrationAction]", error);
    redirectWithStatus(path, "error", getAuthActionErrorMessage(error, "Registrasi admin gagal. Silakan coba lagi."));
  }
}

export async function logoutAction() {
  await clearSession();
  redirect("/auth/login?success=" + encodeURIComponent("Anda berhasil logout."));
}
