package rbac

import (
	"context"
)

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
