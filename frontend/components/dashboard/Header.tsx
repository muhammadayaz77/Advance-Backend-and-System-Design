"use client";

import React, { useCallback, useState } from "react";

import { LogOut, Trash2, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NAVBAR_GREEN, NAVBAR_GREEN_LIGHT } from "@/lib/brand-colors";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout, deleteAccount } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const canDeleteAccount = deleteConfirm === "DELETE";

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Logout failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout, router]);

  const handleDeleteAccount = useCallback(async () => {
    if (!canDeleteAccount || isDeletingAccount) return;
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      toast.success("Your account has been deleted.");
      setDeleteDialogOpen(false);
      setDeleteConfirm("");
      router.replace("/login");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not delete account. Please try again.";
      toast.error(message);
    } finally {
      setIsDeletingAccount(false);
    }
  }, [
    canDeleteAccount,
    deleteAccount,
    isDeletingAccount,
    router,
  ]);

  return (
    <header
      className="h-16 flex items-center justify-between px-6 shadow-sm"
      style={{
        background: `linear-gradient(to right, ${NAVBAR_GREEN}, ${NAVBAR_GREEN_LIGHT})`,
      }}
    >
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8">
          <UserCircle className="w-8 h-8 text-black" />
        </div>
        <span className="text-xl font-bold text-black">Work Sphere</span>
      </div>
      {isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="gap-2 text-black hover:bg-black/5"
              aria-label="Open user menu"
            >
              <UserCircle className="h-6 w-6" />
              <span className="hidden sm:inline font-medium">
                {user?.fullName?.trim() || user?.email || "Account"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[220px]">
            <DropdownMenuLabel className="truncate">
              {user?.email || "Signed in"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                void handleLogout();
              }}
              variant="destructive"
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? "Logging out…" : "Logout"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setDeleteDialogOpen(true);
              }}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeleteConfirm("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-3">
              <span className="block">
                This permanently removes your account and all associated data.
                This cannot be undone.
              </span>
              <span className="block text-foreground font-medium">
                Type{" "}
                <span className="font-mono bg-muted px-1 rounded">DELETE</span>{" "}
                to confirm.
              </span>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                aria-label="Type DELETE to confirm account deletion"
                disabled={isDeletingAccount}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={!canDeleteAccount || isDeletingAccount}
              onClick={() => void handleDeleteAccount()}
            >
              {isDeletingAccount ? "Deleting…" : "Delete account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
