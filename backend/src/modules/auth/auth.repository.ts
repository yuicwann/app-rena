import { PrismaClient } from '../../db/client';
import { Prisma } from '@prisma/client';

export interface UpsertStudentData {
  displayName: string;
  userEmail: string;
  studentUserKey: string;
  passwordHash?: string;
}

export class AuthRepository {
  constructor(private prisma: PrismaClient) {}

  findClassByKey(key: string) {
    return this.prisma.class.findUnique({
      where: { key },
    });
  }

  listClasses() {
    return this.prisma.class.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  createClass(data: { name: string; key: string; passwordHash: string }) {
    return this.prisma.class.create({
      data,
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });
  }

  createLoginAttempt(data: Prisma.LoginAttemptUncheckedCreateInput) {
    return this.prisma.loginAttempt.create({ data });
  }

  findStudentInClass(classId: string, usernameKey: string) {
    return this.prisma.user.findUnique({
      where: {
        classId_usernameKey: {
          classId,
          usernameKey,
        },
      },
    });
  }

  upsertStudent(classId: string, data: UpsertStudentData) {
    return this.prisma.user.upsert({
      where: {
        classId_usernameKey: {
          classId,
          usernameKey: data.studentUserKey,
        },
      },
      create: {
        name: data.displayName,
        email: data.userEmail,
        emailVerified: false,
        classId,
        username: data.displayName,
        usernameKey: data.studentUserKey,
        passwordHash: data.passwordHash,
        role: 'student',
        lastLoginAt: new Date(),
      },
      update: {
        lastLoginAt: new Date(),
        ...(data.passwordHash ? { passwordHash: data.passwordHash } : {}),
      },
    });
  }

  findUserByIdWithClass(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
