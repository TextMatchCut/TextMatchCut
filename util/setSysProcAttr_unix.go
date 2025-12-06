//go:build !windows

package util

import "os/exec"

/*fixes build on !Windows dont remove*/
func SetSysProcAttr(cmd *exec.Cmd) {}
