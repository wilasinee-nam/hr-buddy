"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Role, Permission, DEFAULT_ROLE_PERMISSIONS } from "@/types/permissions";

interface User {
  id: string;
  name: string;
  role: Role;
}

interface PermissionContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  rolePermissions: Record<Role, Permission[]>;
  updateRolePermissions: (role: Role, permissions: Permission[]) => void;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// Mock current user - in real app this would come from auth
const mockUser: User = {
  id: "1",
  name: "สมชาย ใจดี",
  role: "admin",
};

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(mockUser);
  const [rolePermissions, setRolePermissions] = useState<Record<Role, Permission[]>>(
    DEFAULT_ROLE_PERMISSIONS
  );

  const updateRolePermissions = useCallback((role: Role, permissions: Permission[]) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: permissions,
    }));
  }, []);

  const hasPermission = useCallback((permission: Permission): boolean => {
    const userPermissions = rolePermissions[currentUser.role] || [];
    return userPermissions.includes(permission);
  }, [currentUser.role, rolePermissions]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(p));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(p));
  }, [hasPermission]);

  return (
    <PermissionContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        rolePermissions,
        updateRolePermissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission(): PermissionContextType {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermission must be used within a PermissionProvider");
  }
  return context;
}
