import { Permissions } from '../../shared/permission/enums/permissions';

export class Permission {
  id: string;

  userId: string;

  company: string;

  permission: Permissions;

  createdAt: Date;

  updatedAt: Date;
}
