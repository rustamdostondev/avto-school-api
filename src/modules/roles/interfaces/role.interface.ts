export interface IRole {
  id: string;
  name: string;
  description?: string;
  isDeleted?: boolean;

  permissions?: IPermission[];

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;

  // User IDs
  createdById?: string;
  updatedById?: string;
  deletedById?: string;
}

export interface IPermission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateRoleDto {
  name: string;
  description?: string;
  permissions?: string[]; // Array of permission IDs
}

export interface IUpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[]; // Array of permission IDs
}

export interface IAssignPermissionsDto {
  permissions: string[]; // Array of permission IDs
}

export interface IUserRolePermissions {
  roles: IRole[];
  permissions: IPermission[];
}
