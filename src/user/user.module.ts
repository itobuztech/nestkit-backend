import { CurrentUserService } from './current-user/current-user.service';
import { GetUserService } from './get-user/get-users.service';

import { Module } from '@nestjs/common';
import { UpdateProfileService } from './update-profile/update-profile.service';
import { GetPermissionService } from './get-permission/get-permission.service';

@Module({
  providers: [
    GetUserService,
    CurrentUserService,
    UpdateProfileService,
    GetPermissionService,
  ],
})
export class UserModule {}
