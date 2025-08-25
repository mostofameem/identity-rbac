package rbac

import (
	"context"
)

func (s *service) CreateNewPermission(ctx context.Context, req *AddPermission) error {
	_, err := s.permissionRepo.Create(ctx, *req)
	if err != nil {
		return err
	}

	return nil
}

func (s *service) GetPermissions(ctx context.Context, title string) (*[]Permissions, error) {
	permissions, err := s.permissionRepo.Get(ctx, title)
	if err != nil {
		return nil, err
	}

	return permissions, nil
}

func (s *service) AddPermissionToRole(ctx context.Context, req *AddPermissionToRole) error {
	_, err := s.roleHasPermissionRepo.Create(ctx, *req)
	if err != nil {
		return err
	}

	return nil
}
