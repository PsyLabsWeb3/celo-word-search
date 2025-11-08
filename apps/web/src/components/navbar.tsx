"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"
import { useAccount, useConnect, useDisconnect } from 'wagmi'

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Docs", href: "https://docs.celo.org", external: true },
]

export function Navbar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    setMounted(true)
  }, [])

  const renderWalletButton = (isMobile = false) => {
    if (!mounted) {
      return (
        <Button className={`${isMobile ? 'w-full' : ''}`}>
          Connect Wallet
        </Button>
      )
    }

    if (!isConnected) {
      const frameConnector = connectors.find(connector => connector.id === 'frameWallet')

      return (
        <Button 
          onClick={() => frameConnector && connect({ connector: frameConnector })}
          className={`${isMobile ? 'w-full' : ''}`}
        >
          Connect Wallet
        </Button>
      )
    }

    return (
      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-2'}`}>
        <Button variant="outline" size="sm" className={`${isMobile ? 'w-full' : ''}`}>
          Celo
        </Button>
        <span className={`text-sm font-medium ${isMobile ? 'w-full text-center' : ''}`}>
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
        </span>
        <Button
          onClick={() => disconnect()}
          variant="destructive"
          size="sm"
          className={`${isMobile ? 'w-full' : ''}`}
        >
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="flex items-center gap-2 mb-8">

                <span className="font-bold text-lg">
                  celo-crossword
                </span>
              </div>
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className={`flex items-center gap-2 text-base font-medium transition-colors hover:text-primary ${
                      pathname === link.href ? "text-foreground" : "text-foreground/70"
                    }`}
                  >
                    {link.name}
                    {link.external && <ExternalLink className="h-4 w-4" />}
                  </Link>
                ))}
                <div className="mt-6 pt-6 border-t">
                  {renderWalletButton(true)}
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">

            <span className="hidden font-bold text-xl sm:inline-block">
              celo-crossword
            </span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href
                  ? "text-foreground"
                  : "text-foreground/70"
              }`}
            >
              {link.name}
              {link.external && <ExternalLink className="h-4 w-4" />}
            </Link>
          ))}

          <div className="flex items-center gap-3">
            {renderWalletButton(false)}
          </div>
        </nav>
      </div>
    </header>
  )
}