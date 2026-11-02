package proxy

import (
	"context"
	"errors"
	"net"
	"syscall"
	"time"
)

var (
	ErrBlockedPrivateIP = errors.New("SSRF_DEFENSE: outbound connection to private, link-local, or loopback IP range is blocked")
)

// SafeDialer creates a net.Dialer with pre-connect IP hooks preventing SSRF attacks
func SafeDialer() *net.Dialer {
	return &net.Dialer{
		Timeout:   30 * time.Second,
		KeepAlive: 30 * time.Second,
		Control: func(network, address string, c syscall.RawConn) error {
			host, _, err := net.SplitHostPort(address)
			if err != nil {
				host = address
			}

			ip := net.ParseIP(host)
			if ip != nil {
				if isPrivateOrForbidden(ip) {
					return ErrBlockedPrivateIP
				}
			}
			return nil
		},
	}
}

func isPrivateOrForbidden(ip net.IP) bool {
	// Block Loopback (127.0.0.0/8, ::1)
	if ip.IsLoopback() {
		return true
	}
	// Block Link-Local Unicast (169.254.0.0/16, AWS/GCP metadata endpoints)
	if ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() {
		return true
	}
	// Block Private RFC1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
	if ip.IsPrivate() {
		return true
	}
	// Block Unspecified (0.0.0.0)
	if ip.IsUnspecified() {
		return true
	}
	return false
}

// NewSafeTransport returns an http.Transport configured with SSRF protection
func NewSafeTransport() *net.Dialer {
	return SafeDialer()
}
