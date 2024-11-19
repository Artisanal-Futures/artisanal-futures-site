export function formatAddress(addressComponents: {
  "street-address": string;
  address2?: string;
  locality: string;
  region: string;
  "postal-code": string;
  country?: string;
}) {
  let formattedAddress = addressComponents["street-address"];

  if (addressComponents.address2) {
    formattedAddress += `, ${addressComponents.address2}`;
  }

  formattedAddress += `, ${addressComponents.locality}, ${addressComponents.region} ${addressComponents["postal-code"]}`;

  if (addressComponents.country) {
    formattedAddress += `, ${addressComponents.country}`;
  }

  // Clean up any extra spaces or commas
  formattedAddress = formattedAddress
    .replace(/,\s*,/g, ",")
    .trim()
    .replace(/\s\s+/g, " ")
    .replace(/,\s*$/, "");

  if (formattedAddress === ", , US") return null;

  return formattedAddress;
}
