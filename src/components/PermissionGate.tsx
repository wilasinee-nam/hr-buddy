"use client";

import { ReactNode } from "react";
import { usePermission } from "@/contexts/PermissionContext";
import { Permission } from "@/types/permissions";

interface PermissionGateProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function PermissionGate({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  const allPermissions = permission ? [permission, ...permissions] : permissions;

  if (allPermissions.length === 0) {
    return <>{children}</>;
  }

  const hasAccess = requireAll
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
