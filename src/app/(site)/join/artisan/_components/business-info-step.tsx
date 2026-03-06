"use client";

import { useState } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";

import type { SignupFormData } from "./wizard-client";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

const BUSINESS_TYPES = [
  "Handmade goods",
  "Crafts",
  "Jewelry",
  "Ceramics",
  "Furniture",
  "Fiber arts",
  "Food & beverage",
] as const;

const PRODUCT_CATEGORIES = [
  "Apparel",
  "Home goods",
  "Art & prints",
  "Jewelry",
  "Food & beverage",
  "Body care & soap",
  "Basketry",
] as const;

const PRINCIPLES = [
  "Black Owned",
  "Female Owned",
  "Community Education",
  "African American Civil Rights",
  "LGBTQ/Gender neutral",
  "Carbon neutral/sustainability and environmental friendliness",
] as const;

const COMMON_PROCESSES = [
  "Textiles",
  "Woodworking",
  "Metalwork",
  "Digital fabrication",
  "Print media",
  "Heating/cooling",
  "Solar",
  "Farming/growing",
] as const;

const MATERIALS_USED = ["Cotton", "Yarn", "Glass", "Dye", "Ink"] as const;

type BusinessInfoStepProps = {
  formData: Partial<SignupFormData>;
  onNext: (data: Partial<SignupFormData>) => void;
  onBack?: () => void;
};

function CheckboxGroup<TOption extends string>({
  options,
  selected,
  onToggle,
  otherLabel = "Other",
  otherValue,
  onOtherChange,
  idPrefix,
}: {
  options: readonly TOption[];
  selected: string[];
  onToggle: (option: string, checked: boolean) => void;
  otherLabel?: string;
  otherValue: string;
  onOtherChange: (value: string) => void;
  idPrefix: string;
}) {
  const hasOther = selected.includes("Other");
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {options.map((option) => (
        <div
          key={option}
          className="border-border hover:bg-accent flex items-center space-x-3 rounded-md border p-3 transition-colors"
        >
          <Checkbox
            id={`${idPrefix}-${option}`}
            checked={selected.includes(option)}
            onCheckedChange={(checked) => onToggle(option, checked === true)}
          />
          <Label
            htmlFor={`${idPrefix}-${option}`}
            className="cursor-pointer text-sm font-normal select-none"
          >
            {option}
          </Label>
        </div>
      ))}
      <div className="border-border flex flex-col gap-2 rounded-md border p-3 md:col-span-2">
        <div className="flex items-center space-x-3">
          <Checkbox
            id={`${idPrefix}-other`}
            checked={hasOther}
            onCheckedChange={(checked) => onToggle("Other", checked === true)}
          />
          <Label
            htmlFor={`${idPrefix}-other`}
            className="cursor-pointer text-sm font-normal select-none"
          >
            {otherLabel}
          </Label>
        </div>
        {hasOther && (
          <Input
            placeholder="Please specify"
            value={otherValue}
            onChange={(e) => onOtherChange(e.target.value)}
            className="mt-1"
          />
        )}
      </div>
    </div>
  );
}

export function BusinessInfoStep({
  formData,
  onNext,
  onBack,
}: BusinessInfoStepProps) {
  const [businessName, setBusinessName] = useState(formData.businessName ?? "");
  const [businessInterview, setBusinessInterview] = useState(
    formData.businessInterview ?? "",
  );
  const [businessLocation, setBusinessLocation] = useState(
    formData.businessLocation ?? "",
  );
  const [businessEmail, setBusinessEmail] = useState(
    formData.businessEmail ?? "",
  );
  const [businessTelephone, setBusinessTelephone] = useState(
    formData.businessTelephone ?? "",
  );
  const [businessType, setBusinessType] = useState<string[]>(
    formData.businessType ?? [],
  );
  const [businessTypeOther, setBusinessTypeOther] = useState(
    formData.businessTypeOther ?? "",
  );
  const [productCategories, setProductCategories] = useState<string[]>(
    formData.productCategories ?? [],
  );
  const [productCategoriesOther, setProductCategoriesOther] = useState(
    formData.productCategoriesOther ?? "",
  );
  const [principles, setPrinciples] = useState<string[]>(
    formData.principles ?? [],
  );
  const [principlesOther, setPrinciplesOther] = useState(
    formData.principlesOther ?? "",
  );
  const [commonProcesses, setCommonProcesses] = useState<string[]>(
    formData.commonProcesses ?? [],
  );
  const [commonProcessesOther, setCommonProcessesOther] = useState(
    formData.commonProcessesOther ?? "",
  );
  const [materialsUsed, setMaterialsUsed] = useState<string[]>(
    formData.materialsUsed ?? [],
  );
  const [materialsUsedOther, setMaterialsUsedOther] = useState(
    formData.materialsUsedOther ?? "",
  );
  const [websiteLink, setWebsiteLink] = useState(formData.websiteLink ?? "");
  const [socialMediaLinks, setSocialMediaLinks] = useState(
    formData.socialMediaLinks ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  const toggleArray = (
    arr: string[],
    item: string,
    checked: boolean,
    setter: (v: string[]) => void,
  ) => {
    if (checked) {
      setter([...arr, item]);
    } else {
      setter(arr.filter((x) => x !== item));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!businessName.trim()) {
      setError("Please enter your business name");
      return;
    }
    if (!businessInterview.trim()) {
      setError("Please tell us about your business in the interview field");
      return;
    }

    onNext({
      businessName: businessName.trim(),
      businessInterview: businessInterview.trim(),
      businessLocation: businessLocation.trim() || undefined,
      businessEmail: businessEmail.trim() || undefined,
      businessTelephone: businessTelephone.trim() || undefined,
      businessType,
      businessTypeOther: businessTypeOther.trim() || undefined,
      productCategories,
      productCategoriesOther: productCategoriesOther.trim() || undefined,
      principles,
      principlesOther: principlesOther.trim() || undefined,
      commonProcesses,
      commonProcessesOther: commonProcessesOther.trim() || undefined,
      materialsUsed,
      materialsUsedOther: materialsUsedOther.trim() || undefined,
      websiteLink: websiteLink.trim() || undefined,
      socialMediaLinks: socialMediaLinks.trim() || undefined,
    });
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Tell us about your business</CardTitle>
        <CardDescription>
          This information will be used to set up your store
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label
              htmlFor="businessName"
              className="mb-2 block text-sm font-medium"
            >
              Business Name
            </Label>
            <Input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="My Awesome Store"
              required
              autoFocus
            />
          </div>

          <div>
            <Label
              htmlFor="businessInterview"
              className="mb-2 block text-sm font-medium"
            >
              Business Interview
            </Label>
            <Textarea
              id="businessInterview"
              value={businessInterview}
              onChange={(e) => setBusinessInterview(e.target.value)}
              placeholder="Tell us about your business, your story, and what you make..."
              required
              className="min-h-[120px]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
            <div>
              <Label
                htmlFor="businessLocation"
                className="mb-2 block text-sm font-medium"
              >
                Business Location (Optional)
              </Label>
              <Input
                id="businessLocation"
                type="text"
                value={businessLocation}
                onChange={(e) => setBusinessLocation(e.target.value)}
                placeholder="City, State / Region"
              />
            </div>
            <div>
              <Label
                htmlFor="businessEmail"
                className="mb-2 block text-sm font-medium"
              >
                Business Email (Optional)
              </Label>
              <Input
                id="businessEmail"
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="hello@example.com"
              />
            </div>
            <div>
              <Label
                htmlFor="businessTelephone"
                className="mb-2 block text-sm font-medium"
              >
                Business Telephone (Optional)
              </Label>
              <Input
                id="businessTelephone"
                type="tel"
                value={businessTelephone}
                onChange={(e) => setBusinessTelephone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium">Type of business</h3>
            <CheckboxGroup
              idPrefix="businessType"
              options={BUSINESS_TYPES}
              selected={businessType}
              onToggle={(option, checked) =>
                toggleArray(businessType, option, checked, setBusinessType)
              }
              otherValue={businessTypeOther}
              onOtherChange={setBusinessTypeOther}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium">Product categories</h3>
            <CheckboxGroup
              idPrefix="productCategories"
              options={PRODUCT_CATEGORIES}
              selected={productCategories}
              onToggle={(option, checked) =>
                toggleArray(
                  productCategories,
                  option,
                  checked,
                  setProductCategories,
                )
              }
              otherValue={productCategoriesOther}
              onOtherChange={setProductCategoriesOther}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium">Principles</h3>
            <CheckboxGroup
              idPrefix="principles"
              options={PRINCIPLES}
              selected={principles}
              onToggle={(option, checked) =>
                toggleArray(principles, option, checked, setPrinciples)
              }
              otherValue={principlesOther}
              onOtherChange={setPrinciplesOther}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium">Common processes</h3>
            <CheckboxGroup
              idPrefix="commonProcesses"
              options={COMMON_PROCESSES}
              selected={commonProcesses}
              onToggle={(option, checked) =>
                toggleArray(
                  commonProcesses,
                  option,
                  checked,
                  setCommonProcesses,
                )
              }
              otherValue={commonProcessesOther}
              onOtherChange={setCommonProcessesOther}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium">Materials used</h3>
            <CheckboxGroup
              idPrefix="materialsUsed"
              options={MATERIALS_USED}
              selected={materialsUsed}
              onToggle={(option, checked) =>
                toggleArray(materialsUsed, option, checked, setMaterialsUsed)
              }
              otherValue={materialsUsedOther}
              onOtherChange={setMaterialsUsedOther}
            />
          </div>

          <div>
            <Label
              htmlFor="websiteLink"
              className="mb-2 block text-sm font-medium"
            >
              Website (Optional)
            </Label>
            <Input
              id="websiteLink"
              type="url"
              value={websiteLink}
              onChange={(e) => setWebsiteLink(e.target.value)}
              placeholder="https://yourstore.com"
            />
          </div>

          <div>
            <Label
              htmlFor="socialMediaLinks"
              className="mb-2 block text-sm font-medium"
            >
              Social media links (Optional)
            </Label>
            <Textarea
              id="socialMediaLinks"
              value={socialMediaLinks}
              onChange={(e) => setSocialMediaLinks(e.target.value)}
              placeholder="One URL per line (e.g. Instagram, Facebook, Etsy)"
              className="min-h-[80px]"
            />
          </div>

          <div className="flex gap-3">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <Button type="submit" className="flex-1">
              Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
