# Nest Starter Backend Changelog

## V13 - March 8 2025
- Only the Super Admin can update subscription-related data 
- Subscription, Subscription plan, Subscription seed added
- Get available user for assigning new resolver added
- Delete assigned role - added check by workspace id 
- Get assigned user by workspace ID and role ID 
- Resize Image ID issue - bugfix 
- Get current User workspaces - bugfix 
- List membership - Bugfix 

## V12 - Jan 16 2024
- Available Current workspace Information added in current user response 
- GetPrivilges and role removed from currentUser 
- GetPrivilges new resolver Added 
- get admin privileges dynamically based on the current workspace's ownership
- Admin Role Type removed 
- Get assigned user by role ID 
- Image resize + crop fix 

## V11 - Jan 7 2024
- Delete membership features added
- Restore membership features added
- Workspace membership filter with from stash fix 
- Workspace membership order by field added
- Deleted post restore 
- Restore workspace features added

## V10 - Dec 27 2024
- Only the super admin can modify global roles
- Fix workspace list sorting issues with the name  
- Delete role on assignment showing an error 
- The rate limit config can be changed with the env 
- Role schema name field replaced with type 

## V9 - Dec 18 2024
- Rate limit 
- OTP on login if enabled 
- Account lockout features on wrong password and wrong OTP 
- Folder, create, list, delete, get, update resolver done 
- Get file API with resize images list 
- Resize file API added
- File list API added 
- Delete File API added 

## V8 - Dec 2 2024
- Membership invitation email link has been changed 
- Name is optional on signup 
- Profile image upload done 
- Update profile features added 
- Post content now sanitised for XSS attack 
- File upload features added 
- Added membership search options 
- Seed: Workspace is now automatically assigned from seed for new users 
- Every List API now has a total row count based on the payload 
- Post list get author-name 
- Fix create post author ID is optional 

## V7 - Nov 27 2024
- Roles created based on the new workspace 
- The roles list is now based on workspace and global roles 
- Post-update, delete membership guard added
- Workspace-specific posts can now be listed by sending a workspace ID with a header 
- Post-create membership guard added
- List membership - membership guard implemented 

## V6 - Nov 21 2024
- Get post-multi-tenancy added 
- Post deleted and post list now multi-tenancy 
- Post-create + update validation now added for multi-tenancy 
- Post-workspace is now linked 
- Post author ID mapped if not provided 

## V5 - Nov 19 2024 
- After the signup role is added for a user 
- Deny Workspace invitation 
- Get users now searchable and pagination added 
- Workspace update validation 
- Role Update validation 
- Role Create validation 
- Update Post validation 
- Create Post validation 

## V4 - Nov 15 2024 
- Verification signup logic change for token 
- Workspace membership is now available. Membership data can be accessed by workspace ID 
- Based on the membership invitation acceptance workspace list for that user work 
- Membership invitation sent + acceptance done 
- Workspace CRUD can now be accessed only by those who have memberships 
- Create workspace now can attach primary membership who created 
- Workspace CRUD done. 

## V3
- Unassign Role 
- Now multiple roles can be assigned, so based on multiple role privileges need to work as expected 
- Assign a role for a user 
- Deleted items can be viewed by sending extra params with "fromStash" for post and role 
- Deleted items by default filter out from the post list and role list 
- Role-based role-CRUD access 
- Role-based post-CRUD access 

## V2
- Get the Current user role implemented 
- Get current user privileges implemented
- Role + Post delete fix 
- Get a role with Privileges done 

## V1
- Role
- Role List 
- List Privilege 
- Create Role 
- Update Role 
- Delete Role 
- Post 
- Delete Post 

## V0
- Authentication
- Login 
- Current User 
- Signup 
- Verify Email 
- Refresh Token 
- Password Reset request 
- Password Reset 
- User 
- Get User list 
- Create User - Higher level User 
- Post 
- Create Post 
- Update Post 
- Get Post List
- Get Single Post


