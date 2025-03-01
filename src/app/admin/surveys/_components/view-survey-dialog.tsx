"use client";

import { Eye } from "lucide-react";

import type { Survey } from "~/types/survey";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";

type Props = {
  survey: Survey;
};

export function ViewSurveyDialog({ survey }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Eye className="h-4 w-4" /> View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Survey Details</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-6 p-4">
            <div className="space-y-2">
              <h3 className="font-medium">Basic Information</h3>
              <p className="text-sm text-muted-foreground">
                Shop ID: {survey.shopId}
              </p>
              <p className="text-sm text-muted-foreground">
                Owner ID: {survey.ownerId}
              </p>
            </div>

            {survey.processes && (
              <div className="space-y-2">
                <h3 className="font-medium">Processes</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {survey.processes}
                </p>
              </div>
            )}

            {survey.materials && (
              <div className="space-y-2">
                <h3 className="font-medium">Materials</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {survey.materials}
                </p>
              </div>
            )}

            {survey.principles && (
              <div className="space-y-2">
                <h3 className="font-medium">Principles</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {survey.principles}
                </p>
              </div>
            )}

            {survey.description && (
              <div className="space-y-2">
                <h3 className="font-medium">Description</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {survey.description}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-medium">Form Settings</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Unmoderated Form: {survey.unmoderatedForm ? "Yes" : "No"}</p>
                <p>Moderated Form: {survey.moderatedForm ? "Yes" : "No"}</p>
                <p>Hidden Form: {survey.hiddenForm ? "Yes" : "No"}</p>
                <p>Private Form: {survey.privateForm ? "Yes" : "No"}</p>
                <p>Supply Chain: {survey.supplyChain ? "Yes" : "No"}</p>
                <p>Messaging Opt-in: {survey.messagingOptIn ? "Yes" : "No"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Metadata</h3>
              <div className="text-sm text-muted-foreground">
                <p>ID: {survey.id}</p>
                <p>Created At: {survey.createdAt.toLocaleString()}</p>
                <p>Updated At: {survey.updatedAt.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
