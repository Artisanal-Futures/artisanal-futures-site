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
import { LoadButton } from "~/components/common/load-button";

import { EditEditor } from "./edit-editor";

type Props = {
  postId: string;
  title: string;
  content: unknown;
};

export function PostEditButton({ postId, title, content }: Props) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  // const [editedTitle, setEditedTitle] = useState(title)
  const [editedContent, setEditedContent] = useState(content);
  const apiUtils = api.useUtils();
  const router = useRouter();

  const postEditMutation = api.forum.updateSubredditPost.useMutation({
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

  const postDeleteMutation = api.forum.deleteSubredditPost.useMutation({
    onSuccess: ({ message }) => {
      toastService.success(message);
      setIsDeleteAlertOpen(false);
      router.push("/forums");
    },
    onError: ({ message }) => toastService.error(message),
    onSettled: () => {
      void apiUtils.forum.invalidate();
      void apiUtils.forumSubreddit.invalidate();
    },
  });

  const handleDelete = () => {
    postDeleteMutation.mutate(postId);
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
              Edit post
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
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <EditEditor
              content={editedContent}
              postId={postId}
              title={title}
              onSuccess={() => setIsEditDialogOpen(false)}
            >
              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <LoadButton
                  type="submit"
                  isLoading={postEditMutation.isPending}
                >
                  Save Changes
                </LoadButton>
              </DialogFooter>
            </EditEditor>
          </div>{" "}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              post.
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
