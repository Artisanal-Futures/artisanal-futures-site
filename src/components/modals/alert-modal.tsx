"use client";

import { Trash } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../ui/button";
import { Modal } from "./modal";

interface AlertModalProps {
  isOpen: boolean;
  message?: string;
  setIsOpen: (open: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
  asChild?: boolean;
  className?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  setIsOpen,
  className,
  onConfirm,
  loading,
  asChild = false,
  message = "This action cannot be undone.",
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        document.body.style.pointerEvents = "";
      }, 500);
    }
  }, [isOpen]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && loading) {
      setTimeout(() => {
        document.body.style.pointerEvents = "";
      }, 500);
      setIsOpen(false);
    }
  }, [isOpen, loading, setIsOpen]);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Modal
        title="Are you sure?"
        description={message}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <div className="flex w-full items-center justify-end space-x-2 pt-6">
          <Button
            disabled={loading}
            variant="outline"
            type="button"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={loading}
            variant="destructive"
            onClick={onConfirm}
            type="button"
          >
            Continue
          </Button>
        </div>
      </Modal>
      {asChild && (
        <Button
          disabled={loading}
          variant="destructive"
          type="button"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={className}
        >
          <Trash className="h-4 w-4" />
        </Button>
      )}
    </>
  );
};
