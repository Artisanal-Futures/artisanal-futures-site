"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";

import { type Product } from "~/types/product";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export function TagProductsButton() {
  const [open, setOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [tagType, setTagType] = useState<
    "attributeTags" | "materialTags" | "environmentalTags"
  >("attributeTags");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const { data: products } = api.product.getAll.useQuery();
  const { data: stores } = api.shop.getAllValid.useQuery();
  const updateTagsMutation = api.product.updateTags.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const tagOptions = {
    attributeTags: [
      "African American Culture",
      "African Culture",
      "African American Civil Rights",
      "Black Owned",
      "Woman Owned",
      "Community Education",
      "Food Sovereignty",
    ],
    materialTags: ["Cotton", "Wool", "Recycled", "Organic", "Natural Dyes"],
    environmentalTags: [
      "Sustainable",
      "Zero Waste",
      "Low Impact",
      "Biodegradable",
      "Eco-Friendly",
    ],
  };

  const filteredProducts = selectedStore
    ? products?.filter((p) => p.shopId === selectedStore)
    : products;

  const handleSelectAll = () => {
    if (filteredProducts) {
      setSelectedProducts(
        selectedProducts.length === filteredProducts.length
          ? []
          : filteredProducts.map((p) => p.id),
      );
    }
  };

  const handleAddNewTag = () => {
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags([...selectedTags, newTag]);
      setNewTag("");
    }
  };

  const handleSubmit = async () => {
    updateTagsMutation.mutate({
      productIds: selectedProducts,
      tagType: tagType,
      tags: selectedTags,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Tag Products</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tag Multiple Products</DialogTitle>
          <DialogDescription>
            Select products and add tags to them. You can filter by store to
            select all products from specific stores.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Stores</SelectItem>
                {stores?.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedProducts.length === (filteredProducts?.length ?? 0)
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>

          <ScrollArea className="h-[200px] rounded-md border p-4">
            {filteredProducts?.map((product) => (
              <div
                key={product.id}
                className="flex items-center space-x-2 py-2"
              >
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={(checked) => {
                    setSelectedProducts(
                      checked
                        ? [...selectedProducts, product.id]
                        : selectedProducts.filter((id) => id !== product.id),
                    );
                  }}
                />
                <span>{product.name}</span>
              </div>
            ))}
          </ScrollArea>

          <Select
            value={tagType}
            onValueChange={(value: typeof tagType) => setTagType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tag type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="attributeTags">Attribute Tags</SelectItem>
              <SelectItem value="materialTags">Material Tags</SelectItem>
              <SelectItem value="environmentalTags">
                Environmental Tags
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input
              placeholder="Add custom tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddNewTag();
                }
              }}
            />
            <Button variant="outline" onClick={handleAddNewTag}>
              Add Tag
            </Button>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="justify-between"
              >
                {selectedTags.length > 0
                  ? `${selectedTags.length} tags selected`
                  : "Select tags"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput placeholder="Search tags..." />
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  {[...tagOptions[tagType], ...selectedTags]
                    .filter((tag, index, self) => self.indexOf(tag) === index)
                    .map((tag) => (
                      <CommandItem
                        key={tag}
                        onSelect={() => {
                          setSelectedTags(
                            selectedTags.includes(tag)
                              ? selectedTags.filter((t) => t !== tag)
                              : [...selectedTags, tag],
                          );
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTags.includes(tag)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {tag}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={
              (selectedProducts.length === 0 || selectedTags.length === 0) ??
              updateTagsMutation.isPending
            }
          >
            {updateTagsMutation.isPending ? "Applying..." : "Apply Tags"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
