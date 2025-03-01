"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { toastService } from "@dreamwalker-studios/toasts";

import { api } from "~/trpc/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { LoadButton } from "~/components/common/load-button";

type Props = {
  subredditId: string;
  name: string;
  description?: string;
  isPublic?: boolean;
};

export function SubredditEditButton({
  subredditId,
  name,
  description = "",
  isPublic = true,
}: Props) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [editedDescription, setEditedDescription] = useState(description);
  const [editedIsPublic, setEditedIsPublic] = useState(isPublic);
  const apiUtils = api.useUtils();
  const router = useRouter();

  const subredditEditMutation = api.forumSubreddit.updateSubreddit.useMutation({
    onSuccess: ({ message }) => {
      toastService.success(message);
      setIsEditDialogOpen(false);
    },
    onError: ({ message }) => toastService.error(message),
    onSettled: () => {
      void apiUtils.forum.invalidate();
      void apiUtils.forumSubreddit.invalidate();
      router.refresh();
    },
  });

  const subredditDeleteMutation =
    api.forumSubreddit.deleteSubreddit.useMutation({
      onSuccess: ({ message }) => {
        toastService.success(message);
        setIsDeleteAlertOpen(false);
        router.push("/forums");
      },
      onError: ({ message }) => toastService.error(message),
      onSettled: () => {
        void apiUtils.forum.invalidate();
        void apiUtils.forumSubreddit.invalidate();
        router.refresh();
      },
    });

  const handleDelete = () => {
    subredditDeleteMutation.mutate({ id: subredditId });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    subredditEditMutation.mutate({
      id: subredditId,
      name: editedName,
      description: editedDescription,
      isPublic: editedIsPublic,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit subreddit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsDeleteAlertOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subreddit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Subreddit Name</p>
              <div className="relative">
                <p className="absolute inset-y-0 left-0 grid w-8 place-items-center text-sm text-zinc-400">
                  r/
                </p>
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="pl-6"
                />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Description (Optional)</p>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Describe your subreddit..."
                className="resize-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="public-mode"
                checked={editedIsPublic}
                onCheckedChange={setEditedIsPublic}
              />
              <Label htmlFor="public-mode">Make subreddit public</Label>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <LoadButton
                type="submit"
                isLoading={subredditEditMutation.isPending}
              >
                Save Changes
              </LoadButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              subreddit and all its posts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
