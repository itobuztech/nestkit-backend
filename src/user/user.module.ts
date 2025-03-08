import { CurrentUserService } from './current-user/current-user.service';
import { UserListService } from './user-list/user-list.service';

import { Module } from '@nestjs/common';
import { UpdateProfileService } from './update-profile/update-profile.service';
import { GetPermissionService } from './get-permission/get-permission.service';

@Module({
  providers: [
    UserListService,
    CurrentUserService,
    UpdateProfileService,
    GetPermissionService,
  ],
})
export class UserModule {}
