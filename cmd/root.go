package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var (
	RootCmd = &cobra.Command{
		Use:   "identity-rbac",
		Short: "identity-rbac server binary",
	}
)

func init() {
	RootCmd.AddCommand(serveRestCmd)
	RootCmd.AddCommand(migrateCmd)
	RootCmd.AddCommand(serveAddUserCmd)
	RootCmd.AddCommand(serveSeedingCmd)
}

func Execute() {
	if err := RootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
