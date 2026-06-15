import permissionsConfig from '../../../shared/permissions.config.json';
import type { Role } from '../models/auth';

export type PermissionRole = Role | 'Anonymous';
export type PermissionResource = keyof typeof permissionsConfig.resources;

type FieldPermission = {
  view: readonly string[];
  edit: readonly string[];
};

type ResourcePermission = {
  actions: Record<string, readonly string[]>;
  fields: Record<string, FieldPermission>;
};

const resources = permissionsConfig.resources as Record<PermissionResource, ResourcePermission>;

export function canAccess(role: PermissionRole, resource: PermissionResource, action: string) {
  const allowedRoles = permissionResource(resource).actions[action];
  return hasRole(allowedRoles, role);
}

export function canViewField(role: PermissionRole, resource: PermissionResource, field: string) {
  const permission = permissionResource(resource).fields[field];
  return hasRole(permission?.view, role);
}

export function canEditField(role: PermissionRole, resource: PermissionResource, field: string) {
  const permission = permissionResource(resource).fields[field];
  return hasRole(permission?.edit, role);
}

export function filterEditablePayload<TPayload extends Record<string, unknown>>(
  role: PermissionRole,
  resource: PermissionResource,
  payload: TPayload
) {
  return Object.fromEntries(
    Object.entries(payload).filter(([field]) => canEditField(role, resource, field))
  ) as Partial<TPayload>;
}

function permissionResource(resource: PermissionResource) {
  return resources[resource];
}

function hasRole(allowedRoles: readonly string[] | undefined, role: PermissionRole) {
  return Boolean(allowedRoles?.some(allowedRole => allowedRole.toLowerCase() === role.toLowerCase()));
}
