"use client";

import { useFormContext } from "react-hook-form";

import type { SignupFormData } from "~/lib/validators/onboarding";
import { InputFormField } from "~/components/inputs/input-form-field";
import { SelectFormField } from "~/components/inputs/select-form-field";
import { TagSelectFormField } from "~/components/inputs/tag-select-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";

import { useArtisanSignup } from "../../_components/artisan-signup-form-provider";
import { WizardFooter } from "../../_components/wizard-footer";

const BUSINESS_TYPES = [
  "Handmade goods",
  "Crafts",
  "Jewelry",
  "Ceramics",
  "Furniture",
  "Fiber arts",
  "Food & beverage",
  "Other",
] as const;

const PRODUCT_CATEGORIES = [
  "Apparel",
  "Home goods",
  "Art & prints",
  "Jewelry",
  "Food & beverage",
  "Body care & soap",
  "Basketry",
  "Other",
] as const;

const PRINCIPLES = [
  "Black Owned",
  "Female Owned",
  "Community Education",
  "African American Civil Rights",
  "LGBTQ/Gender neutral",
  "Carbon neutral/sustainability and environmental friendliness",
  "Other",
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
  "Other",
] as const;

const MATERIALS_USED = [
  "Cotton",
  "Yarn",
  "Glass",
  "Dye",
  "Ink",
  "Other",
] as const;

const BUSINESS_FIELD_NAMES: (keyof SignupFormData)[] = [
  "businessName",
  "businessInterview",
  "businessLocation",
  "businessEmail",
  "businessTelephone",
  "businessType",
  "businessTypeOther",
  "productCategories",
  "productCategoriesOther",
  "principles",
  "principlesOther",
  "commonProcesses",
  "commonProcessesOther",
  "materialsUsed",
  "materialsUsedOther",
  "websiteLink",
  "socialMediaLinks",
];

export function BusinessInfoStep() {
  const form = useFormContext<SignupFormData>();
  const { goNext, goBack, currentStep } = useArtisanSignup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = await form.trigger(BUSINESS_FIELD_NAMES);
    if (valid) goNext();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div
          key={currentStep}
          className="animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div className="mb-8">
            <h2 className="text-foreground text-xl font-semibold sm:text-2xl">
              Tell us about your shop
            </h2>
            <p className="text-muted-foreground mt-2">
              Help us understand your business and what makes it special
            </p>
          </div>

          <div className="space-y-6">
            <InputFormField
              form={form}
              name="businessName"
              label="Business Name *"
              placeholder="My Awesome Store"
              required
              autoFocus
            />

            <TextareaFormField
              form={form}
              name="businessInterview"
              label="Business Interview *"
              placeholder="Tell us about your business, your story, and what you make..."
              required
              rows={5}
              textareaClassName="min-h-[120px]"
            />

            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              <InputFormField
                form={form}
                name="businessLocation"
                label="Business Location"
                placeholder="City, State / Region"
              />

              <InputFormField
                form={form}
                name="websiteLink"
                label="Website"
                type="url"
                placeholder="https://yourstore.com"
              />

              <InputFormField
                form={form}
                name="businessEmail"
                label="Business Email"
                type="email"
                placeholder="hello@example.com"
                className="col-span-1"
              />
              <InputFormField
                form={form}
                name="businessTelephone"
                label="Business Telephone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="col-span-1"
              />
            </div>

            <TextareaFormField
              form={form}
              name="socialMediaLinks"
              label="Social media links (Optional)"
              placeholder="One URL per line (e.g. Instagram, Facebook, Etsy)"
              rows={3}
              textareaClassName="min-h-[80px]"
            />

            <SelectFormField
              form={form}
              name="businessType"
              label="What type of business are you in? *"
              placeholder="Select a business type"
              values={[...BUSINESS_TYPES].map((option) => ({
                value: option,
                label: option,
              }))}
            />

            {form.watch("businessType")?.includes("Other") && (
              <InputFormField
                form={form}
                name="businessTypeOther"
                label="Other (please specify)"
                placeholder="Please specify"
              />
            )}

            <TagSelectFormField
              form={form}
              allowCustom={true}
              customTagPlaceholder="Add custom category..."
              description="Help us understand the categories of products you make"
              name="productCategories"
              label="Product categories *"
              items={PRODUCT_CATEGORIES.map((option) => ({
                id: option,
                label: option,
              }))}
            />

            <TagSelectFormField
              form={form}
              allowCustom={true}
              customTagPlaceholder="Add custom principle..."
              description="Help us understand your business's values and principles"
              name="principles"
              label="Principles *"
              items={PRINCIPLES.map((option) => ({
                id: option,
                label: option,
              }))}
            />

            <TagSelectFormField
              form={form}
              allowCustom={true}
              customTagPlaceholder="Add custom process..."
              description="Help us understand the processes you use when creating your products"
              name="commonProcesses"
              label="Common processes *"
              items={COMMON_PROCESSES.map((option) => ({
                id: option,
                label: option,
              }))}
            />

            <TagSelectFormField
              form={form}
              allowCustom={true}
              description="Help us understand the materials you use in your products"
              customTagPlaceholder="Add custom material..."
              name="materialsUsed"
              label="Materials used *"
              items={MATERIALS_USED.map((option) => ({
                id: option,
                label: option,
              }))}
            />
          </div>
        </div>
      </div>

      {/* Footer navigation */}

      <WizardFooter goBack={goBack} currentStep={currentStep} />
    </form>
  );
}
