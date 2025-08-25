package rbac

import (
	"context"
	"identity-rbac/internal/util"
)

func (s *service) CreateNewRole(ctx context.Context, req *AddRole) error {
	_, err := s.roleRepo.Create(ctx, *req)
	if err != nil {
		return err
	}

	return nil
}

func (s *service) CreateNewRoleV2(ctx context.Context, req *AddRoleV2) error {
	// Validate that all permissions exist
	for _, permissionId := range req.PermissionIDs {
		permission, err := s.permissionRepo.GetOne(ctx, permissionId)
		if err != nil {
			return err
		}

		if permission == nil {
			return util.ErrNotFound
		}
	}

	err := s.roleRepo.CreateRoleWithPermissionsTx(ctx, *req)
	if err != nil {
		return err
	}

	return nil
}

func (s *service) GetRoles(ctx context.Context, title string) ([]Roles, error) {
	roles, err := s.roleRepo.Get(ctx, title)
	if err != nil {
		return nil, err
	}

	return roles, nil
}

func (s *service) GetRolesWithPermissions(ctx context.Context, title string) ([]RolesWithPermissions, error) {
	rolesWithPermissions, err := s.roleRepo.GetRolesWithPermissions(ctx, title)
	if err != nil {
		return nil, err
	}

	return rolesWithPermissions, nil
}

func (s *service) AddRoleToUser(ctx context.Context, req *AddRoleToUser) error {
	_, err := s.userHasRoleRepo.Create(ctx, *req)
	if err != nil {
		return err
	}

	return nil
}
