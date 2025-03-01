"use client";

import Image from "next/image";
import { type UpcyclingItem } from "~/types";
import { Eye } from "lucide-react";

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
  item: UpcyclingItem;
};

export function ViewUpcycleDialog({ item }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Eye className="h-4 w-4" /> View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item.project_title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-6 p-4">
            <div className="space-y-2">
              <h3 className="font-medium">User Information</h3>
              <p className="text-sm text-muted-foreground">
                Email: {item.user?.email ?? "Guest"}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Prompt</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {item.prompt}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Question</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {item.question}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">AI Response</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {item.llm_response}
              </p>
            </div>

            <div className="flex gap-4">
              {item.input_image_url && (
                <div className="space-y-2">
                  <h3 className="font-medium">Input Image</h3>
                  <Image
                    src={item.input_image_url}
                    alt="Input"
                    className="max-h-96 rounded-md object-contain"
                    width={384}
                    height={384}
                  />
                </div>
              )}

              {item.output_image_url && (
                <div className="space-y-2">
                  <h3 className="font-medium">Output Image</h3>
                  <Image
                    src={item.output_image_url}
                    alt="Output"
                    className="max-h-96 rounded-md object-contain"
                    width={384}
                    height={384}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Metadata</h3>
              <div className="text-sm text-muted-foreground">
                <p>ID: {item.id}</p>
                <p>User ID: {item.user_id}</p>
                <p>
                  Created At: {new Date(item.generation_date).toLocaleString()}
                </p>
                <p>Generation Time: {item.generation_time} seconds</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
